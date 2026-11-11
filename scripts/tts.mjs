/**
 * scripts/tts.mjs
 *
 * Text-to-Speech synthesis for the video pipeline.
 *
 * Usage:
 *   node scripts/tts.mjs "videos/<slug>/script/script.json" "<slug>" [--force]
 *
 * TTS provider selection (in priority order):
 *   1. ElevenLabs  — if ELEVENLABS_API_KEY is set (primary)
 *   2. Gemini TTS  — if GEMINI_API_KEY is set (fallback)
 *   3. Edge TTS    — always tried last; needs `pip install edge-tts` + ffmpeg
 *
 * Voice ID resolution (ElevenLabs):
 *   1. Template voice config  — from src/templates/registry.ts (if --template was used)
 *   2. ELEVENLABS_VOICE_ID    — from .env
 *   3. Built-in default       — hardcoded fallback
 *
 * Output: public/<slug>/voice.mp3
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { groupTextChunks, normalizeForVieNeu } from './tts-chunks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Load .env manually (no dotenv dependency needed in scripts) ──────────────
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
const [, , scriptJsonPath, slug, ...flags] = process.argv;
const force = flags.includes('--force');
const unknownFlags = flags.filter((flag) => flag !== '--force');

if (!scriptJsonPath || !slug || unknownFlags.length > 0) {
  console.error('Usage: node scripts/tts.mjs <script.json path> <slug> [--force]');
  if (unknownFlags.length > 0) {
    console.error(`Unknown flag(s): ${unknownFlags.join(', ')}`);
  }
  process.exit(1);
}

// ─── Read script ──────────────────────────────────────────────────────────────
if (!fs.existsSync(scriptJsonPath)) {
  console.error(`Error: script.json not found at ${scriptJsonPath}`);
  process.exit(1);
}

const scriptData = JSON.parse(fs.readFileSync(scriptJsonPath, 'utf-8'));
const fullText = scriptData.script.map((s) => s.text).join(' ');

if (!fullText.trim()) {
  console.error('Error: script.json contains no text');
  process.exit(1);
}

// ─── Resolve template voice config ───────────────────────────────────────────
/**
 * If this slug was generated with --template, read the templateId from
 * videos/<slug>/template.txt and look up voice config from registry.ts.
 *
 * Registry is a TypeScript file so we parse it as text instead of importing.
 * We extract the voice block for the matching template ID using regex.
 *
 * Returns { elevenLabsVoiceId?, geminiVoice? } or {}
 */
function resolveTemplateVoice(slug) {
  const templateTxtPath = path.join(ROOT, 'videos', slug, 'template.txt');
  if (!fs.existsSync(templateTxtPath)) {
    return {}; // flexible mode — no template
  }

  const templateId = fs.readFileSync(templateTxtPath, 'utf-8').trim();
  if (!templateId) return {};

  const registryPath = path.join(ROOT, 'src', 'templates', 'registry.ts');
  if (!fs.existsSync(registryPath)) return {};

  try {
    const registrySource = fs.readFileSync(registryPath, 'utf-8');

    // Find the registry entry block for this templateId
    // Look for the id: '<templateId>' and extract the surrounding object
    const idPattern = new RegExp(
      `id:\\s*['"\`]${templateId.replace(/[/\\]/g, '\\$&')}['"\`]`,
    );

    if (!idPattern.test(registrySource)) {
      console.error(`⚠️  Template "${templateId}" not found in registry — using default voice`);
      return {};
    }

    // Extract elevenLabsVoiceId if present
    const elevenMatch = registrySource.match(
      new RegExp(
        `id:\\s*['"\`]${templateId.replace(/[/\\]/g, '\\$&')}['"\`][^}]*?elevenLabsVoiceId:\\s*['"\`]([^'"\`]+)['"\`]`,
        's',
      ),
    );

    // Extract geminiVoice if present
    const geminiMatch = registrySource.match(
      new RegExp(
        `id:\\s*['"\`]${templateId.replace(/[/\\]/g, '\\$&')}['"\`][^}]*?geminiVoice:\\s*['"\`]([^'"\`]+)['"\`]`,
        's',
      ),
    );

    // Extract speed if present (e.g. speed: 1.15)
    const speedMatch = registrySource.match(
      new RegExp(
        `id:\\s*['"\`]${templateId.replace(/[/\\]/g, '\\$&')}['"\`][^}]*?speed:\\s*([0-9.]+)`,
        's',
      ),
    );

    // Extract vieneuVoice if present (local VieNeu-TTS preset voice name)
    const vieneuMatch = registrySource.match(
      new RegExp(
        `id:\\s*['"\`]${templateId.replace(/[/\\]/g, '\\$&')}['"\`][^}]*?vieneuVoice:\\s*['"\`]([^'"\`]+)['"\`]`,
        's',
      ),
    );

    const voice = {};
    if (vieneuMatch?.[1]) voice.vieneuVoice = vieneuMatch[1];
    if (elevenMatch?.[1]) voice.elevenLabsVoiceId = elevenMatch[1];
    if (geminiMatch?.[1]) voice.geminiVoice = geminiMatch[1];
    if (speedMatch?.[1])  voice.speed = Number(speedMatch[1]);

    if (Object.keys(voice).length > 0) {
      console.error(`🎭  Template voice config found for "${templateId}":`);
      if (voice.vieneuVoice)       console.error(`   VieNeu:     ${voice.vieneuVoice}`);
      if (voice.elevenLabsVoiceId) console.error(`   ElevenLabs: ${voice.elevenLabsVoiceId}`);
      if (voice.geminiVoice)       console.error(`   Gemini:     ${voice.geminiVoice}`);
      if (voice.speed)             console.error(`   Speed:      ${voice.speed}x`);
    }

    return voice;
  } catch (err) {
    console.error(`⚠️  Could not read template voice config: ${err.message}`);
    return {};
  }
}

const templateVoice = resolveTemplateVoice(slug);

// ─── Output path ─────────────────────────────────────────────────────────────
const outputDir = path.join(ROOT, 'public', slug);
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'voice.mp3');

if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0 && !force) {
  console.error(`♻️  Reusing existing voice.mp3 at ${outputPath}`);
  console.error('   Pass --force only for an explicit user-approved voice regeneration.');
  console.log(outputPath);
  process.exit(0);
}

// ─── VieNeu-TTS (local, free, 48 kHz) ────────────────────────────────────────
// Used first when the template sets vieneuVoice, or when .env sets TTS_PROVIDER=vieneu / VIENEU_VOICE.
const VIENEU_DIR = process.env.VIENEU_DIR || path.join(process.env.HOME || '', 'Documents', 'VieNeu-TTS');
const VIENEU_PYTHON = path.join(VIENEU_DIR, '.venv', 'bin', 'python');
const vieneuVoiceName = process.env.VIENEU_VOICE || templateVoice.vieneuVoice || 'Thùy Dung';
const useVieNeu = process.env.TTS_PROVIDER === 'vieneu' || Boolean(process.env.VIENEU_VOICE || templateVoice.vieneuVoice);

async function generateWithVieNeu(narration, outPath) {
  if (!fs.existsSync(VIENEU_PYTHON)) throw new Error(`VieNeu venv not found at ${VIENEU_PYTHON} (set VIENEU_DIR)`);
  console.error('🎙  TTS provider: VieNeu-TTS (local)');
  console.error(`   Voice: ${vieneuVoiceName}`);
  const textPath = `${outPath}.vieneu.txt`;
  const wavPath = `${outPath}.vieneu.wav`;
  fs.writeFileSync(textPath, normalizeForVieNeu(narration));
  const run = (cmd, args) => new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    proc.on('error', reject);
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited with code ${code}`))));
  });
  try {
    await run(VIENEU_PYTHON, [path.join(__dirname, 'vieneu-synth.py'), textPath, vieneuVoiceName, wavPath]);
    await run('ffmpeg', ['-v', 'error', '-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-q:a', '2', outPath]);
  } finally {
    fs.rmSync(textPath, { force: true });
    fs.rmSync(wavPath, { force: true });
  }
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) throw new Error('VieNeu produced no audio');
  console.error(`   ✅ Saved to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

// ─── Gemini TTS ───────────────────────────────────────────────────────────────
async function generateWithGemini(narration, outPath) {
  const apiKey = process.env.GEMINI_API_KEY;
  // Priority: template voice config → .env GEMINI_TTS_VOICE → default
  const voice = templateVoice.geminiVoice || process.env.GEMINI_TTS_VOICE || 'Achird';

  console.error('🎙  TTS provider: Gemini (fallback)');
  console.error(`   Voice: ${voice}`);

  // Lazy-import so the package is only required when Gemini is actually used
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const ttsModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.8-flash-lite-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  let response;
  let lastError;

  for (const model of ttsModels) {
    let succeeded = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: narration }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
        succeeded = true;
        break;
      } catch (err) {
        lastError = err;
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          console.error(`   ⚠️ Gemini TTS model "${model}" quota reached, trying next model...`);
          break;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    if (succeeded) break;
  }

  if (!response) {
    throw lastError || new Error('Gemini TTS failed on all candidate models');
  }

  // Extract audio data from the response
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) {
    throw new Error('Gemini TTS returned no audio data');
  }

  // The API returns base64-encoded raw PCM: 24 kHz, 16-bit signed LE, mono
  const pcmBuffer = Buffer.from(data, 'base64');
  if (pcmBuffer.length === 0) {
    throw new Error('Gemini TTS returned empty PCM buffer');
  }

  console.error(`   PCM buffer: ${(pcmBuffer.length / 1024).toFixed(1)} KB — converting to MP3 via ffmpeg…`);

  const ffmpegArgs = [
    '-y',                  // overwrite output
    '-f', 's16le',         // input format: signed 16-bit little-endian PCM
    '-ar', '24000',        // sample rate: 24 kHz
    '-ac', '1',            // channels: mono
    '-i', 'pipe:0',        // read from stdin
  ];

  if (templateVoice.speed && templateVoice.speed !== 1.0) {
    ffmpegArgs.push('-filter:a', `atempo=${templateVoice.speed}`);
  }

  ffmpegArgs.push(
    '-codec:a', 'libmp3lame',
    '-q:a', '2',           // VBR quality ~190 kbps
    outPath,
  );

  await new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

    ff.on('error', (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)));
    ff.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });

    ff.stdin.write(pcmBuffer);
    ff.stdin.end();
  });

  const stat = fs.statSync(outPath);
  console.error(`   ✅ Saved to ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────
async function generateWithElevenLabs(narration, outPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  // Priority: template voice config → .env ELEVENLABS_VOICE_ID → built-in default
  const voiceId = templateVoice.elevenLabsVoiceId
    || process.env.ELEVENLABS_VOICE_ID
    || 'K7ewtjKRNtwwt3lKQ6M0'; // default fallback

  console.error('🎙  TTS provider: ElevenLabs');
  console.error(`   Voice ID: ${voiceId}${templateVoice.elevenLabsVoiceId ? ' (from template)' : ''}`);

  const payload = {
    text: narration,
    model_id: 'eleven_v3',
    output_format: 'mp3_44100_128',
  };

  if (templateVoice.speed) {
    payload.voice_settings = {
      stability: 0.45,
      similarity_boost: 0.8,
      speed: templateVoice.speed,
    };
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('ElevenLabs returned empty audio');
  }

  fs.writeFileSync(outPath, buffer);
  console.error(`   ✅ Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function generateWithEdgeTTS(narration, outPath) {
  const voice = templateVoice.edgeVoice || process.env.EDGE_TTS_VOICE || 'vi-VN-NamMinhNeural';
  console.error('🎙  TTS provider: Edge TTS (Resilient High-Quality Neural)');
  console.error(`   Voice: ${voice}`);

  const speedRate = templateVoice.speed && templateVoice.speed !== 1.0
    ? `${templateVoice.speed >= 1.0 ? '+' : ''}${Math.round((templateVoice.speed - 1.0) * 100)}%`
    : '+0%';

  // Split into sentences / segments if long to prevent Edge TTS websocket timeouts
  const scriptEntries = Array.isArray(scriptData?.script) ? scriptData.script : null;
  const chunks = scriptEntries && scriptEntries.length > 0
    ? scriptEntries.map(s => s.text)
    : narration.split(/(?<=[.?!])\s+/).filter(Boolean);

  const pyCode = `
import edge_tts, asyncio, os, subprocess, sys

voice = sys.argv[1]
rate = sys.argv[2]
out_path = sys.argv[3]
chunks = sys.argv[4:]

async def gen_chunk(text, file_path):
    for attempt in range(5):
        try:
            c = edge_tts.Communicate(text, voice, rate=rate)
            await c.save(file_path)
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                return True
        except Exception as e:
            await asyncio.sleep(1.0)
    return False

async def main():
    part_files = []
    tmp_dir = os.path.dirname(out_path)
    for i, chunk in enumerate(chunks):
        pfile = os.path.join(tmp_dir, f'_part_{i}.mp3')
        ok = await gen_chunk(chunk, pfile)
        if not ok:
            sys.exit(1)
        part_files.append(pfile)
        await asyncio.sleep(0.3)
    
    list_file = os.path.join(tmp_dir, '_concat_list.txt')
    with open(list_file, 'w') as f:
        for p in part_files:
            f.write(f"file '{os.path.basename(p)}'\\n")
    
    res = subprocess.run(['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', list_file, '-c', 'copy', out_path], capture_output=True)
    for p in part_files:
        if os.path.exists(p): os.remove(p)
    if os.path.exists(list_file): os.remove(list_file)
    if res.returncode != 0:
        sys.exit(res.returncode)

asyncio.run(main())
`;

  await new Promise((resolve, reject) => {
    const proc = spawn('python3', ['-c', pyCode, voice, speedRate, outPath, ...chunks], { stdio: ['inherit', 'inherit', 'inherit'] });
    proc.on('error', (err) => reject(new Error(`edge-tts spawn error: ${err.message}`)));
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath) && fs.statSync(outPath).size > 0) resolve();
      else reject(new Error(`edge-tts chunked synthesis exited with code ${code}`));
    });
  });

  const stat = fs.statSync(outPath);
  console.error(`   ✅ Saved to ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// ─── Dead-air trim ────────────────────────────────────────────────────────────
// Shorten pauses longer than 0.4s to 0.25s so Shorts narration has no dead air.
const DEAD_AIR_FILTER = 'silenceremove=stop_periods=-1:stop_duration=0.4:stop_threshold=-40dB:stop_silence=0.25';

// Long-form keeps natural pauses: viewers need breathing room over 8-12 minutes.
const KEEP_PAUSES_TEMPLATES = new Set(['news/long-explainer']);

async function trimDeadAirAndExit(outPath) {
  const templateTxt = path.join(ROOT, 'videos', slug, 'template.txt');
  if (fs.existsSync(templateTxt) && KEEP_PAUSES_TEMPLATES.has(fs.readFileSync(templateTxt, 'utf-8').trim())) {
    console.error('   ⏸  Long-form template: natural pauses kept');
    console.log(outPath);
    process.exit(0);
  }
  const tmpPath = `${outPath}.trim.mp3`;
  try {
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', outPath, '-af', DEAD_AIR_FILTER,
        '-codec:a', 'libmp3lame', '-q:a', '2', tmpPath], { stdio: ['ignore', 'inherit', 'inherit'] });
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))));
    });
    fs.renameSync(tmpPath, outPath);
    console.error('   ✂️  Trimmed pauses longer than 0.4s');
  } catch (err) {
    fs.rmSync(tmpPath, { force: true });
    console.error(`   ⚠️  Dead-air trim skipped (${err.message}) — keeping original voice.mp3`);
  }
  console.log(outPath);
  process.exit(0);
}

// ─── Long-form chunking ───────────────────────────────────────────────────────
const textChunks = groupTextChunks(scriptData.script.map((s) => s.text));

/** Run one provider per chunk, then join the parts into outPath; a short script stays one request. */
async function synthesize(provider, outPath) {
  if (textChunks.length === 1) return provider(fullText, outPath);
  console.error(`   🧩 Long script: ${textChunks.length} TTS requests`);
  const parts = textChunks.map((_, i) => `${outPath}.part${i}.mp3`);
  const listPath = `${outPath}.parts.txt`;
  try {
    for (let i = 0; i < parts.length; i += 1) await provider(textChunks[i], parts[i]);
    fs.writeFileSync(listPath, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
        '-codec:a', 'libmp3lame', '-q:a', '2', outPath], { stdio: ['ignore', 'inherit', 'inherit'] });
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg concat exited with code ${code}`))));
    });
  } finally {
    for (const p of [...parts, listPath]) fs.rmSync(p, { force: true });
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
console.error(`\n📝 Script text (${fullText.length} chars):`);
console.error(`   "${fullText.slice(0, 80)}${fullText.length > 80 ? '...' : ''}"`);

if (useVieNeu) {
  try {
    // VieNeu chunks sentences itself, so the whole script goes in one call (one model load).
    await generateWithVieNeu(fullText, outputPath);
    await trimDeadAirAndExit(outputPath);
  } catch (err) {
    console.error(`\n⚠️  VieNeu TTS failed: ${err.message} — falling back to next provider`);
  }
}

if (process.env.ELEVENLABS_API_KEY) {
  try {
    await synthesize(generateWithElevenLabs, outputPath);
    await trimDeadAirAndExit(outputPath);
  } catch (err) {
    console.error(`\n⚠️  ElevenLabs TTS failed: ${err.message} — falling back to next provider`);
  }
}

if (process.env.GEMINI_API_KEY) {
  try {
    await synthesize(generateWithGemini, outputPath);
    await trimDeadAirAndExit(outputPath);
  } catch (err) {
    console.error(`\n⚠️  Gemini TTS failed: ${err.message} — falling back to Edge TTS`);
  }
}

try {
  await generateWithEdgeTTS(fullText, outputPath);
  await trimDeadAirAndExit(outputPath);
} catch (err) {
  console.error(`\n⚠️  Edge TTS failed: ${err.message}`);
}

console.error(
  '\n❌ TTS failed: No provider succeeded.\n' +
  'Set ELEVENLABS_API_KEY or GEMINI_API_KEY in .env, or verify edge-tts installation.',
);
process.exit(1);
