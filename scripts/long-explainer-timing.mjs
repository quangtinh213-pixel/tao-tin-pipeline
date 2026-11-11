#!/usr/bin/env node
/**
 * Scene + chapter timing skeleton for news/long-explainer (one scene per script entry).
 *
 * Usage: node scripts/long-explainer-timing.mjs "<slug>"
 * Reads  videos/<slug>/plan.json (chapters[].title), videos/<slug>/script/script.json
 *        (script[].chapter = chapter index), public/<slug>/timeline.json (words + segments).
 * Writes videos/<slug>/scene-timing.json → copy chapters + beats into spec.json, then add a visual per beat.
 */
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const FPS = 30;
const SNAP_SECONDS = 2;
function charSim(s1, s2) {
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  let matches = 0;
  for (const c of s1) if (s2.includes(c)) matches++;
  return (2 * matches) / (s1.length + s2.length);
}

const cleanWord = (t) => t.toLowerCase().normalize('NFC').replace(/[^a-z0-9à-ỹ]/gu, '');

/** Match script entries directly to transcript words using fuzzy window search, with anchor interpolation. */
export function buildLongExplainerTiming({chapters, script, timeline}) {
  const words = timeline.words ?? [];
  if (!words.length) throw new Error('timeline.json has no words');
  if (!script.length) throw new Error('script.json has no entries');
  const totalFrames = Math.ceil(timeline.duration * FPS) + 30;

  const tw = words.map((w) => ({
    word: cleanWord(w.word),
    start: w.start,
    end: w.end,
  }));

  let currentPos = 0;
  const starts = [];

  script.forEach((entry, idx) => {
    if (idx === 0) {
      starts.push(0);
      return;
    }

    const entryWords = entry.text.split(/\s+/u).map(cleanWord).filter(Boolean).slice(0, 5);
    let bestPos = -1;
    let bestScore = 0;
    const searchLimit = Math.min(tw.length - 3, currentPos + 180);

    for (let pos = currentPos + 1; pos < searchLimit; pos++) {
      let score = 0;
      for (let k = 0; k < entryWords.length; k++) {
        if (pos + k < tw.length) {
          score += charSim(tw[pos + k].word, entryWords[k]);
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    }

    if (bestPos !== -1 && bestScore >= 2.0) {
      currentPos = bestPos;
      starts.push(tw[bestPos].start);
    } else {
      // Fallback: estimate from previous anchor
      starts.push(null);
    }
  });

  // Interpolate any null starts
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] === null) {
      let nextValid = i + 1;
      while (nextValid < starts.length && starts[nextValid] === null) nextValid++;
      const nextTime = nextValid < starts.length ? starts[nextValid] : timeline.duration;
      const prevTime = starts[i - 1];
      const step = (nextTime - prevTime) / (nextValid - i + 1);
      starts[i] = prevTime + step;
    }
  }

  const startFrames = [];
  starts.forEach((t, i) => {
    const frame = i === 0 ? 0 : Math.max(Math.round(t * FPS), startFrames[i - 1] + 1);
    startFrames.push(Math.min(frame, totalFrames - (script.length - i)));
  });

  const scenes = script.map((entry, i) => {
    const end = i + 1 < script.length ? starts[i + 1] : timeline.duration;
    return {
      startFrame: startFrames[i],
      durationFrames: (startFrames[i + 1] ?? totalFrames) - startFrames[i],
      chapterIndex: entry.chapter,
      audioSegment: {start: starts[i], end, text: entry.text},
    };
  });

  const chapterTimes = chapters.map((chapter, index) => {
    const first = scenes.find((scene) => scene.chapterIndex === index);
    if (!first) throw new Error(`Chapter ${index} ("${chapter.title}") has no script entry`);
    return {title: chapter.title, startFrame: first.startFrame};
  });
  if (chapterTimes[0]?.startFrame !== 0) throw new Error('The first script entry must belong to chapter 0');
  if (chapterTimes.some((c, i) => i > 0 && c.startFrame <= chapterTimes[i - 1].startFrame)) {
    throw new Error('Chapters must appear in script order');
  }
  return {fps: FPS, totalFrames, chapters: chapterTimes, scenes};
}

const MIN_BEAT_SECONDS = 3;
const MAX_BEAT_SECONDS = 7;
const endsSentence = (word) => /[.?!…]["”')]*$/u.test(word);

/** Split one entry's words into sentence groups: short sentences merge, long ones split at the comma nearest the middle. */
export function splitIntoBeats(words, minSeconds = MIN_BEAT_SECONDS, maxSeconds = MAX_BEAT_SECONDS) {
  const sentences = [];
  let current = [];
  for (const w of words) {
    current.push(w);
    if (endsSentence(w.word)) sentences.push(current), (current = []);
  }
  if (current.length) sentences.push(current);
  const span = (ws) => ws[ws.length - 1].end - ws[0].start;
  const pieces = sentences.flatMap((ws) => {
    if (span(ws) <= maxSeconds) return [ws];
    const mid = ws[0].start + span(ws) / 2;
    const commas = ws.map((w, i) => (/,$/u.test(w.word) && i < ws.length - 1 ? i : -1)).filter((i) => i >= 0);
    if (!commas.length) return [ws];
    const cut = commas.reduce((best, i) => (Math.abs(ws[i].end - mid) < Math.abs(ws[best].end - mid) ? i : best));
    return [ws.slice(0, cut + 1), ws.slice(cut + 1)];
  });
  const beats = [];
  for (const piece of pieces) {
    const last = beats[beats.length - 1];
    if (last && (span(last) < minSeconds || span(piece) < minSeconds / 2) && span([...last, ...piece]) <= maxSeconds) last.push(...piece);
    else beats.push([...piece]);
  }
  return beats;
}

/** Beats inside each entry scene; beat frames tile the scene exactly. */
export function buildLongExplainerBeats({scenes, timeline}) {
  return scenes.flatMap((scene) => {
    const from = scene.startFrame / FPS;
    const to = (scene.startFrame + scene.durationFrames) / FPS;
    const words = timeline.words.filter((w) => w.start >= from - 0.05 && w.start < to - 0.05);
    const groups = words.length ? splitIntoBeats(words) : [];
    const starts = groups.map((g, i) => (i === 0 ? scene.startFrame : Math.round(g[0].start * FPS)));
    const end = scene.startFrame + scene.durationFrames;
    if (!groups.length) return [{startFrame: scene.startFrame, durationFrames: scene.durationFrames, chapterIndex: scene.chapterIndex, text: ''}];
    return groups.map((g, i) => ({
      startFrame: starts[i],
      durationFrames: (starts[i + 1] ?? end) - starts[i],
      chapterIndex: scene.chapterIndex,
      text: g.map((w) => w.word).join(' '),
    })).filter((b) => b.durationFrames > 0);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/long-explainer-timing.mjs "<slug>"');
    process.exit(1);
  }
  const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
  const plan = await read(`videos/${slug}/plan.json`);
  const {script} = await read(`videos/${slug}/script/script.json`);
  const timeline = await read(`public/${slug}/timeline.json`);
  const result = buildLongExplainerTiming({chapters: plan.chapters, script, timeline});
  result.beats = buildLongExplainerBeats({scenes: result.scenes, timeline});
  await writeFile(`videos/${slug}/scene-timing.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`videos/${slug}/scene-timing.json: ${result.beats.length} beats, ${result.scenes.length} entries, ${result.chapters.length} chapters, ${result.totalFrames} frames`);
}
