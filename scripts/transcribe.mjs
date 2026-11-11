/**
 * scripts/transcribe.mjs
 *
 * Transcribe audio with word/segment-level timestamps.
 *
 * Provider selection:
 *   1. Groq Whisper — if GROQ_API_KEY is set (primary)
 *   2. api.stt.ai   — if STT_API_KEY is set (fallback)
 *
 * Usage:
 *   node scripts/transcribe.mjs "<slug>"
 *
 * Input:  public/<slug>/voice.mp3
 * Output: public/<slug>/timeline.json
 *
 * Output format (timeline.json):
 * {
 *   "duration": 68.4,
 *   "segments": [
 *     { "start": 0.0, "end": 1.9, "text": "Ây, ai viết code nhanh như rocket," }
 *   ],
 *   "words": [
 *     { "word": "Ây,", "start": 0.0, "end": 0.2 }
 *   ]
 * }
 *
 * Segments drive scene timing. Words are required for subtitle highlighting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { normalizeWordTimestamps } from './transcribe-helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadEnv();

// ─── Args ─────────────────────────────────────────────────────────────────────
const [, , slug] = process.argv;

if (!slug) {
  console.error('Usage: node scripts/transcribe.mjs <slug>');
  process.exit(1);
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const audioPath = path.join(ROOT, 'public', slug, 'voice.mp3');
const outputPath = path.join(ROOT, 'public', slug, 'timeline.json');

if (!fs.existsSync(audioPath)) {
  console.error(`Error: voice.mp3 not found at ${audioPath}`);
  process.exit(1);
}

// ─── Config ───────────────────────────────────────────────────────────────────
const groqApiKey = process.env.GROQ_API_KEY;
const groqModel = process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';
const sttApiKey = process.env.STT_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const language = process.env.STT_LANGUAGE || 'vi';

if (!groqApiKey && !sttApiKey && !geminiApiKey) {
  console.error('Error: set GROQ_API_KEY, STT_API_KEY, or GEMINI_API_KEY in .env');
  process.exit(1);
}

function validateTimeline(timeline) {
  if (!timeline.segments || !Array.isArray(timeline.segments) || timeline.segments.length === 0) {
    throw new Error('STT provider returned no segments');
  }

  if (!Array.isArray(timeline.words)) {
    timeline.words = [];
  }

  if (timeline.duration === null || timeline.duration === undefined) {
    const lastSegment = timeline.segments[timeline.segments.length - 1];
    const lastWord = timeline.words[timeline.words.length - 1];
    timeline.duration = Math.max(lastSegment?.end ?? 0, lastWord?.end ?? 0);
  }

  for (let i = 0; i < timeline.segments.length; i++) {
    const seg = timeline.segments[i];
    if (typeof seg.start !== 'number' || typeof seg.end !== 'number') {
      throw new Error(`Invariant violation: segment[${i}] has invalid timestamps`);
    }
    if (seg.start > seg.end) {
      throw new Error(`Invariant violation: segment[${i}].start (${seg.start}) > end (${seg.end})`);
    }
    if (i > 0 && seg.start < timeline.segments[i - 1].start) {
      throw new Error(`Invariant violation: segment[${i}].start (${seg.start}) < segment[${i - 1}].start`);
    }
  }

  for (let i = 0; i < timeline.words.length; i++) {
    const w = timeline.words[i];
    if (typeof w.start !== 'number' || typeof w.end !== 'number') {
      throw new Error(`Invariant violation: word[${i}] "${w.word}" has invalid timestamps`);
    }
    if (w.start > w.end) {
      throw new Error(`Invariant violation: word[${i}] "${w.word}" start (${w.start}) > end (${w.end})`);
    }
    if (i > 0 && w.start < timeline.words[i - 1].start) {
      throw new Error(`Invariant violation: word[${i}] "${w.word}" start (${w.start}) < word[${i - 1}].start`);
    }
  }

  return timeline;
}

function normalizeGroqResponse(data) {
  const segments = Array.isArray(data.segments)
    ? data.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: String(seg.text ?? '').trim(),
      }))
    : [];

  const words = Array.isArray(data.words)
    ? data.words.map((word) => ({
        word: String(word.word ?? '').trim(),
        start: word.start,
        end: word.end,
      }))
    : [];

  return validateTimeline({
    duration: data.duration ?? null,
    segments,
    words: normalizeWordTimestamps(words),
  });
}

function normalizeSttAiResponse(data) {
  const allWords = [];

  const timeline = {
    duration: data.duration ?? null,
    segments: Array.isArray(data.segments)
      ? data.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: String(seg.text ?? '').trim(),
        }))
      : [],
    words: [],
  };

  for (const seg of data.segments ?? []) {
    if (Array.isArray(seg.words) && seg.words.length > 0) {
      for (const w of seg.words) {
        allWords.push({
          word: String(w.word ?? '').trim(),
          start: w.start,
          end: w.end,
        });
      }
    }
  }

  timeline.words = allWords;
  return validateTimeline(timeline);
}

async function transcribeWithGroq() {
  console.log('   Provider: Groq');
  console.log(`   Model:    ${groqModel}`);

  const audioBuffer = fs.readFileSync(audioPath);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  const formData = new FormData();
  formData.append('file', audioBlob, 'voice.mp3');
  formData.append('model', groqModel);
  formData.append('language', language);
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq STT API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return normalizeGroqResponse(data);
}

async function transcribeWithSttAi() {
  console.log('   Provider: api.stt.ai');

  const audioBuffer = fs.readFileSync(audioPath);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  const formData = new FormData();
  formData.append('file', audioBlob, 'voice.mp3');
  formData.append('language', language);
  formData.append('speakers', '1');

  const response = await fetch('https://api.stt.ai/v1/transcribe', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sttApiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`api.stt.ai error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return normalizeSttAiResponse(data);
}

async function transcribeWithGemini() {
  console.log('   Provider: Gemini STT (gemini-3-flash-preview)');

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString('base64');

  const prompt = `Listen carefully to this Vietnamese audio. Transcribe it into JSON with segments (start, end, text) and word-level timestamps (word, start, end). Format:
{
  "duration": number,
  "segments": [{"start": number, "end": number, "text": string}],
  "words": [{"word": string, "start": number, "end": number}]
}
Strict requirements:
- start and end must be accurate in seconds (floats).
- all segments and words must be strictly increasing.
- output valid JSON only.`;

  let parsedData = null;
  let lastErr;
  const modelsToTry = ['gemini-3-flash-preview', 'gemini-3.8-flash'];
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        let text = resp.text ? resp.text.trim() : '';
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
        parsedData = JSON.parse(text);
        if (parsedData && Array.isArray(parsedData.segments)) {
          break;
        }
      } catch (e) {
        lastErr = e;
        console.warn(`   Gemini STT (${model}) attempt ${attempt} failed: ${e.message?.slice(0, 80)}. Retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (parsedData) break;
  }

  if (!parsedData) {
    throw lastErr || new Error('Failed to transcribe and parse JSON with Gemini STT');
  }

  const rawJson = parsedData;
  const segments = Array.isArray(rawJson.segments)
    ? rawJson.segments.map((seg) => ({
        start: Number(seg.start),
        end: Number(seg.end),
        text: String(seg.text ?? '').trim(),
      }))
    : [];

  const words = Array.isArray(rawJson.words)
    ? rawJson.words.map((word) => ({
        word: String(word.word ?? '').trim(),
        start: Number(word.start),
        end: Number(word.end),
      }))
    : [];

  segments.sort((a, b) => a.start - b.start);
  words.sort((a, b) => a.start - b.start);

  return validateTimeline({
    duration: rawJson.duration ?? null,
    segments,
    words: normalizeWordTimestamps(words),
  });
}

async function transcribeWithLocalWhisper() {
  console.log('   Provider: Local faster-whisper');
  const uvPath = fs.existsSync('/Users/quangtinh/.local/bin/uv') ? '/Users/quangtinh/.local/bin/uv' : 'uv';
  const pyScript = path.join(__dirname, 'whisper-transcribe.py');
  const tempOut = outputPath;
  execSync(`${uvPath} run --python 3.11 --with faster-whisper python "${pyScript}" "${audioPath}" "${tempOut}"`, {
    stdio: 'inherit',
  });
  const data = JSON.parse(fs.readFileSync(tempOut, 'utf-8'));
  return validateTimeline({
    duration: data.duration ?? null,
    segments: data.segments ?? [],
    words: normalizeWordTimestamps(data.words ?? []),
  });
}

async function transcribe() {
  if (groqApiKey) {
    try {
      return await transcribeWithGroq();
    } catch (err) {
      console.error(`\n⚠️  Groq STT failed: ${err.message}`);
    }
  }

  if (sttApiKey) {
    try {
      return await transcribeWithSttAi();
    } catch (err) {
      console.error(`\n⚠️  api.stt.ai failed: ${err.message}`);
    }
  }

  // Try local faster-whisper
  try {
    return await transcribeWithLocalWhisper();
  } catch (err) {
    console.error(`\n⚠️  Local Whisper failed: ${err.message}`);
  }

  if (geminiApiKey) {
    return transcribeWithGemini();
  }

  throw new Error('No STT provider available');
}

// ─── Transcribe ───────────────────────────────────────────────────────────────
console.log(`\n🎧 Transcribing: ${audioPath}`);
console.log(`   Language: ${language}`);

try {
  const timeline = await transcribe();

  // ─── Write output ───────────────────────────────────────────────────────────
  fs.writeFileSync(outputPath, JSON.stringify(timeline, null, 2), 'utf-8');

  console.log(`\n✅ Transcription complete`);
  console.log(`   Segments: ${timeline.segments.length}`);
  console.log(`   Words:    ${timeline.words.length}`);
  console.log(`   Duration: ${timeline.duration}s`);
  console.log(`   Output:   ${outputPath}`);

  // Print segment summary
  console.log('\n📋 Segments:');
  for (const seg of timeline.segments) {
    const dur = (seg.end - seg.start).toFixed(2);
    console.log(`   [${seg.start.toFixed(2)}s – ${seg.end.toFixed(2)}s | ${dur}s] "${seg.text.slice(0, 60)}${seg.text.length > 60 ? '...' : ''}"`);
  }

} catch (err) {
  console.error(`\n❌ Transcription failed: ${err.message}`);
  process.exit(1);
}
