#!/usr/bin/env node
/**
 * Pacing + provenance checks for a news/long-explainer v2 spec.
 *
 * Usage: node scripts/validate-long-explainer.mjs "<slug>"
 * Errors fail (exit 1); warnings print but pass.
 */
import fs from 'node:fs';
import path from 'node:path';

const FPS = 30;
export const MAX_BEAT_SECONDS = 8;
export const MAX_DATA_SECONDS = 10;
export const MIN_EVIDENCE_SHARE = 0.2;

// "390.000", "390000" and 390000 compare equal: separators between digits are dropped on both sides.
const digitsOnly = (text) => text.replace(/(\d)[.,](?=\d)/gu, '$1');
const numbersIn = (value) => digitsOnly(JSON.stringify(value)).match(/\d+/gu) ?? [];

/** Returns {errors, warnings} for a parsed spec and the concatenated source-context text. */
export function validateLongExplainer(spec, sourceText) {
  const errors = [];
  const warnings = [];
  const beats = spec.beats ?? [];
  if (!beats.length) errors.push('spec.beats is empty');
  const assets = new Set((spec.mediaAssets ?? []).map((a) => a.id));
  const shots = new Set((spec.evidenceShots ?? []).map((s) => s.id));
  const source = sourceText.replace(/\s+/gu, ' ');

  let expected = 0;
  beats.forEach((beat, i) => {
    const at = `beat ${i} (${(beat.startFrame / FPS).toFixed(1)}s)`;
    if (beat.startFrame !== expected) errors.push(`${at}: starts at ${beat.startFrame}, expected ${expected}`);
    expected = beat.startFrame + beat.durationFrames;
    const seconds = beat.durationFrames / FPS;
    const v = beat.visual ?? {};
    const limit = v.type === 'data' ? MAX_DATA_SECONDS : MAX_BEAT_SECONDS;
    if (seconds > limit) errors.push(`${at}: ${seconds.toFixed(1)}s ${v.type} beat, max ${limit}s — split it`);
    if (v.type === 'collage') {
      if (!v.photos?.length || v.photos.length > 3) errors.push(`${at}: collage needs 1-3 photos`);
      for (const p of v.photos ?? []) if (!assets.has(p.assetId)) errors.push(`${at}: unknown asset ${p.assetId}`);
    } else if (v.type === 'evidence') {
      if (!shots.has(v.shotId)) errors.push(`${at}: unknown evidence shot ${v.shotId}`);
    } else if (v.type === 'quote') {
      if (!source.includes(v.text.replace(/\s+/gu, ' ').replace(/^"|"$/gu, ''))) errors.push(`${at}: quote is not verbatim in the sources`);
      if (v.portraitAssetId && !assets.has(v.portraitAssetId)) errors.push(`${at}: unknown asset ${v.portraitAssetId}`);
    } else if (v.type === 'data') {
      // Derived figures (a calculation) must say so in graphic.source.
      if (!/^tính từ/iu.test(v.graphic?.source ?? '')) {
        const missing = numbersIn({...v.graphic, source: undefined}).filter((n) => !digitsOnly(source).includes(n));
        if (missing.length) errors.push(`${at}: numbers not in sources: ${[...new Set(missing)].join(', ')}`);
      }
    } else if (v.type !== 'kinetic') {
      errors.push(`${at}: unknown visual type ${v.type}`);
    }
    if (i >= 2 && beats[i - 1].visual?.type === v.type && beats[i - 2].visual?.type === v.type) {
      errors.push(`${at}: third ${v.type} beat in a row`);
    }
  });
  if (beats.length && expected !== spec.totalFrames) errors.push(`beats end at ${expected}, totalFrames is ${spec.totalFrames}`);

  const evidenceShare = beats.filter((b) => b.visual?.type === 'evidence').length / Math.max(1, beats.length);
  if (evidenceShare < MIN_EVIDENCE_SHARE) errors.push(`evidence beats are ${(evidenceShare * 100).toFixed(0)}%, need at least ${MIN_EVIDENCE_SHARE * 100}%`);

  for (const chapter of spec.chapters ?? []) {
    if (!beats.some((b) => b.startFrame === chapter.startFrame)) errors.push(`chapter "${chapter.title}" does not start on a beat`);
  }
  const hook = beats.filter((b) => b.startFrame < 30 * FPS);
  const hookAvg = hook.reduce((a, b) => a + b.durationFrames, 0) / FPS / Math.max(1, hook.length);
  if (hookAvg > 3.5) warnings.push(`first 30s averages ${hookAvg.toFixed(1)}s per beat; aim for 1.5-2.5s cuts in the hook`);
  return {errors, warnings};
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/validate-long-explainer.mjs "<slug>"');
    process.exit(1);
  }
  const spec = JSON.parse(fs.readFileSync(`videos/${slug}/spec.json`, 'utf8'));
  const sourceText = (spec.sources ?? [])
    .map((s) => path.join('videos', s.evidenceSlug, 'source-context.txt'))
    .filter((p) => fs.existsSync(p))
    .map((p) => fs.readFileSync(p, 'utf8'))
    .join('\n');
  const {errors, warnings} = validateLongExplainer(spec, sourceText);
  for (const w of warnings) console.warn(`⚠️  ${w}`);
  for (const e of errors) console.error(`❌ ${e}`);
  if (errors.length) process.exit(1);
  console.log(`Spec hợp lệ: ${spec.beats.length} beat, ${spec.chapters.length} chương.`);
}
