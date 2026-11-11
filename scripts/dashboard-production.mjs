import {spawn} from 'node:child_process';
import {modelCandidates} from './rank-news.mjs';
import {mkdir, readFile, readdir, stat, writeFile} from 'node:fs/promises';
import {join, relative, resolve, sep} from 'node:path';

const STAGES = [
  ['setup', 'Khởi tạo'],
  ['acquire', 'Lấy media nguồn'],
  ['planner', 'Lập kế hoạch'],
  ['teller', 'Viết kịch bản'],
  ['audio', 'Tạo giọng đọc'],
  ['transcribe', 'Căn thời gian'],
  ['spec', 'Dựng đặc tả'],
  ['caption', 'Tạo caption'],
  ['coder', 'Lắp cảnh'],
  ['render', 'Render video'],
  ['verify', 'Kiểm tra đầu ra'],
];

const AUDIO_MODES = new Set(['full', 'music', 'sfx', 'voice-only', 'template']);
const ACTIVE_STATUSES = new Set(['queued', 'running']);
const MAX_BODY_BYTES = 128 * 1024;
const MAX_TOOL_ROUNDS = 80;

export class AssemblyMutex {
  constructor() {
    this.owner = null;
    this.queue = [];
  }

  async acquire(id, onWait) {
    if (this.owner === id) return () => {};
    if (!this.owner) {
      this.owner = id;
      return () => this.release(id);
    }
    if (typeof onWait === 'function') onWait();
    await new Promise((resolve) => this.queue.push({id, resolve}));
    this.owner = id;
    return () => this.release(id);
  }

  release(id) {
    if (this.owner !== id) return;
    this.owner = null;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve();
    }
  }
}

function now() {
  return new Date().toISOString();
}

function publicJob(job) {
  return {
    id: job.id,
    slug: job.slug,
    context: job.context,
    templateId: job.templateId,
    audioMode: job.audioMode,
    model: job.model,
    status: job.status,
    stage: job.stage,
    stageLabel: STAGES.find(([id]) => id === job.stage)?.[1] ?? job.stage,
    progress: job.progress,
    message: job.message,
    error: job.error,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    logs: job.logs.slice(-160),
  };
}

function appendLog(job, message, kind = 'info') {
  const clean = String(message ?? '').replace(/\u001b\[[0-9;]*m/gu, '').trim();
  if (!clean) return;
  for (const line of clean.split(/\r?\n/u)) {
    job.logs.push({at: now(), kind, message: line.slice(0, 1200)});
  }
  if (job.logs.length > 500) job.logs.splice(0, job.logs.length - 500);
}

function setStage(job, stage, message) {
  const index = STAGES.findIndex(([id]) => id === stage);
  if (index < 0) throw new Error(`Unknown production stage: ${stage}`);
  job.stage = stage;
  job.progress = Math.max(job.progress, Math.round((index / (STAGES.length - 1)) * 100));
  job.message = message || STAGES[index][1];
  appendLog(job, job.message, 'stage');
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/^https?:\/\//u, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 68) || 'video';
}

function deriveJobSlug(context, date = new Date()) {
  const datePart = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return `${datePart}-${slugify(context)}`;
}

function extractFirstUrl(text) {
  const match = String(text ?? '').match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : String(text ?? '').trim();
}

function isTikTokShopUrl(context) {
  try {
    const url = new URL(extractFirstUrl(context));
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname.includes('tiktok.com') ||
        url.hostname.includes('tiktokv.com') ||
        url.hostname.includes('byteimg.com'))
    );
  } catch {
    return false;
  }
}

function isPublicArticleUrl(context) {
  try {
    const url = new URL(extractFirstUrl(context));
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !['localhost', '127.0.0.1'].includes(url.hostname) &&
      !isTikTokShopUrl(context)
    );
  } catch {
    return false;
  }
}

function safeInside(rootDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\0')) {
    throw new Error('Invalid project path.');
  }
  const root = resolve(rootDir);
  const candidate = resolve(root, relativePath);
  const rel = relative(root, candidate);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..') throw new Error('Path is outside the project.');
  return {candidate, rel};
}

function assertReadablePath(rootDir, relativePath) {
  const resolved = safeInside(rootDir, relativePath);
  const blocked = ['.env', '.git', 'node_modules'];
  if (blocked.some((part) => resolved.rel === part || resolved.rel.startsWith(`${part}${sep}`))) {
    throw new Error(`Reading ${relativePath} is not allowed.`);
  }
  return resolved;
}

function assertWritablePath(rootDir, slug, relativePath) {
  const resolved = safeInside(rootDir, relativePath);
  const normalized = resolved.rel.split(sep).join('/');
  const prefixes = [`videos/${slug}/`, `public/${slug}/`, 'src/'];
  if (!prefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error(`Writing ${relativePath} is outside this production job. You must write files under videos/${slug}/, public/${slug}/, or src/.`);
  }
  return resolved;
}

async function walkFiles(rootDir, start = '.', limit = 300) {
  const base = assertReadablePath(rootDir, start).candidate;
  const output = [];
  async function walk(directory) {
    if (output.length >= limit) return;
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (['node_modules', '.git'].includes(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else output.push(relative(rootDir, path));
      if (output.length >= limit) return;
    }
  }
  await walk(base);
  return output;
}

function runCommand(job, rootDir, command, args) {
  if (job.abortController.signal.aborted) throw new Error('Production cancelled.');
  appendLog(job, `$ ${command} ${args.join(' ')}`, 'command');
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {cwd: rootDir, env: process.env});
    job.child = child;
    let output = '';
    const consume = (chunk, kind) => {
      const text = chunk.toString();
      output = `${output}${text}`.slice(-30000);
      appendLog(job, text, kind);
    };
    child.stdout.on('data', (chunk) => consume(chunk, 'stdout'));
    child.stderr.on('data', (chunk) => consume(chunk, 'stderr'));
    child.once('error', reject);
    child.once('close', (code, signal) => {
      job.child = null;
      if (code === 0) resolvePromise(output);
      else reject(new Error(`${command} stopped with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
    });
  });
}

function availableActions(job) {
  const slug = job.slug;
  return {
    acquire_source_media: ['node', ['scripts/source-evidence.mjs', job.context, slug], 'acquire'],
    acquire_tiktok_product: ['node', ['scripts/tiktok-product.mjs', job.context, slug], 'acquire'],
    generate_product_image: ['node', ['scripts/generate-product-image.mjs', slug, job.context], 'acquire'],
    synthesize_voice: ['node', ['scripts/tts.mjs', `videos/${slug}/script/script.json`, slug], 'audio'],
    transcribe_voice: ['node', ['scripts/transcribe.mjs', slug], 'transcribe'],
    generate_caption: ['node', ['scripts/generate-caption.mjs', slug], 'caption'],
    validate_caption: ['node', ['scripts/validate-caption.mjs', `videos/${slug}/caption.txt`, `videos/${slug}/spec.json`, `videos/${slug}/script/script.json`], 'caption'],
    typecheck: ['npx', ['tsc', '--noEmit'], 'coder'],
    test: ['npm', ['test'], 'coder'],
    render: ['npx', ['remotion', 'render', 'src/Root.tsx', 'Video', `videos/${slug}/output/video.mp4`, '--codec', 'h264', '--hardware-acceleration', 'if-possible', '--x264-preset', 'faster'], 'render'],
    probe_output: ['npx', ['remotion', 'ffprobe', `videos/${slug}/output/video.mp4`], 'verify'],
  };
}

async function acquireAssemblyLock(job, assemblyMutex) {
  if (!assemblyMutex || job.hasAssemblyLock) return;
  if (!job.waitingForLock) {
    appendLog(job, 'Chờ tài nguyên dựng Remotion (Assembly Lock)...', 'info');
    job.waitingForLock = true;
  }
  const release = await assemblyMutex.acquire(job.id, () => {
    job.message = 'Chờ tài nguyên dựng Remotion...';
  });
  job.waitingForLock = false;
  job.hasAssemblyLock = true;
  job.releaseAssemblyLock = release;
  appendLog(job, 'Đã nhận quyền truy cập Remotion Assembly Lock.', 'info');
}

async function executeTool({job, rootDir, name, args, assemblyMutex}) {
  if (name === 'report_stage') {
    if (['coder', 'render', 'verify'].includes(args.stage)) {
      await acquireAssemblyLock(job, assemblyMutex);
    }
    setStage(job, args.stage, args.message);
    return {ok: true};
  }
  if (name === 'list_files') {
    return {files: await walkFiles(rootDir, args.path || '.', Math.min(args.limit || 200, 500))};
  }
  if (name === 'read_files') {
    const files = [];
    for (const path of args.paths.slice(0, 12)) {
      const {candidate, rel} = assertReadablePath(rootDir, path);
      const fileStat = await stat(candidate);
      if (!fileStat.isFile()) throw new Error(`${path} is not a file.`);
      if (fileStat.size > 240000) throw new Error(`${path} is too large to read.`);
      files.push({path: rel, content: await readFile(candidate, 'utf8')});
    }
    return {files};
  }
  if (name === 'write_file') {
    const {candidate, rel} = assertWritablePath(rootDir, job.slug, args.path);
    if (rel.startsWith('src/') || rel === 'src') {
      await acquireAssemblyLock(job, assemblyMutex);
    }
    await mkdir(resolve(candidate, '..'), {recursive: true});
    await writeFile(candidate, args.content, 'utf8');
    appendLog(job, `Đã ghi ${rel}`, 'file');
    return {ok: true, path: rel, bytes: Buffer.byteLength(args.content)};
  }
  if (name === 'run_action') {
    if (['typecheck', 'test', 'render'].includes(args.action)) {
      await acquireAssemblyLock(job, assemblyMutex);
    }
    const actions = availableActions(job);
    const configured = actions[args.action];
    if (!configured) throw new Error(`Unknown action: ${args.action}`);
    const [command, commandArgs, stage] = configured;
    setStage(job, stage, args.message || `Đang chạy ${args.action}`);
    const output = await runCommand(job, rootDir, command, commandArgs);
    return {ok: true, output};
  }
  if (name === 'finish') {
    const outputPath = join(rootDir, 'videos', job.slug, 'output', 'video.mp4');
    const outputStat = await stat(outputPath);
    if (!outputStat.isFile() || outputStat.size === 0) throw new Error('Rendered video.mp4 is missing or empty.');
    job.agentFinished = true;
    setStage(job, 'verify', args.summary || 'Đã hoàn tất và kiểm tra video');
    return {ok: true, outputPath, size: outputStat.size};
  }
  throw new Error(`Unknown tool: ${name}`);
}

const TOOLS = [
  {
    type: 'function', name: 'report_stage', description: 'Update the visible production stage before doing work in that stage.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {stage: {type: 'string', enum: STAGES.map(([id]) => id)}, message: {type: 'string'}}, required: ['stage', 'message']},
  },
  {
    type: 'function', name: 'list_files', description: 'List project files below a safe project-relative directory.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {path: {type: 'string'}, limit: {type: 'integer', minimum: 1, maximum: 500}}, required: ['path', 'limit']},
  },
  {
    type: 'function', name: 'read_files', description: 'Read up to 12 UTF-8 project files. Secrets and dependency directories are blocked.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {paths: {type: 'array', minItems: 1, maxItems: 12, items: {type: 'string'}}}, required: ['paths']},
  },
  {
    type: 'function', name: 'write_file', description: 'Write one complete UTF-8 file. Writes are limited to this video artifacts and src/.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {path: {type: 'string'}, content: {type: 'string'}}, required: ['path', 'content']},
  },
  {
    type: 'function', name: 'run_action', description: 'Run one allowlisted workflow action and return its output.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {action: {type: 'string', enum: ['acquire_source_media', 'acquire_tiktok_product', 'generate_product_image', 'synthesize_voice', 'transcribe_voice', 'generate_caption', 'validate_caption', 'typecheck', 'test', 'render', 'probe_output']}, message: {type: 'string'}}, required: ['action', 'message']},
  },
  {
    type: 'function', name: 'finish', description: 'Finish only after video.mp4 exists and verification has passed.', strict: true,
    parameters: {type: 'object', additionalProperties: false, properties: {summary: {type: 'string'}}, required: ['summary']},
  },
];

export function isTransientAgentError(error) {
  const status = error?.status || error?.statusCode;
  return status === 503 ||
    status === 429 ||
    status === 502 ||
    status === 504 ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    /overload|busy|unavailable|rate limit|timeout|connection error|fetch failed/i.test(String(error?.message || ''));
}

async function runOpenAiAgent(job, rootDir, {assemblyMutex} = {}) {
  const {default: OpenAI} = await import('openai');
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const tiktok = isTikTokShopUrl(job.context);
  const article = isPublicArticleUrl(job.context);
  const input = [{
    role: 'user',
    content: `Produce one complete Remotion video in the current project.

Job:
- slug: ${job.slug}
- context: ${job.context}
- template: ${job.templateId}
- audio mode: ${job.audioMode}
- tiktok Shop URL shortcut: ${tiktok}
- article URL shortcut: ${article}

MANDATORY RULES:
1. Step 1 (Setup) is ALREADY COMPLETED by the server. The workspace directories (videos/${job.slug}/ and public/${job.slug}/) and initial setup files (videos/${job.slug}/context.txt, template.txt, audio.txt) have already been created with the exact slug "${job.slug}".
2. You MUST use the exact slug "${job.slug}" for all file paths, tools, actions, and verification. NEVER derive a different slug, NEVER rename or truncate the slug, and NEVER attempt to write to any other directory. All file tools are locked to "${job.slug}".
3. Read AGENTS.md and docs/SKILL-GEN-VIDEO.md first, then progressively load only the required canonical docs.
4. Follow the exact pipeline:
   - If tiktok Shop URL shortcut is true: run action "acquire_tiktok_product" first to scrape product data and media. You can also run "generate_product_image" to create scenario/meme illustration images for the script.
   - If article URL shortcut is true: run action "acquire_source_media" first.
   - Step 2: Planner (write videos/${job.slug}/plan.json).
   - Step 3: Teller (write videos/${job.slug}/script/script.json). For commerce templates, write humorous or psychological reverse-exposure scripts with fast pacing and strong retention hooks.
   - Step 4: Audio (run action "synthesize_voice").
   - Step 5: Transcribe (run action "transcribe_voice").
   - Step 6: Spec (write videos/${job.slug}/spec.json). For commerce templates, YOU MUST INCLUDE PRODUCT MEDIA in scenes (check public/${job.slug}/evidence/ for images). Assign media: {src: "${job.slug}/evidence/image-01.jpg"} or mediaList arrays to hook, reveal, and features scenes. NEVER output empty media scenes.
   - Caption (run action "generate_caption", then "validate_caption").
   - Step 7: Coder (update src/Root.tsx, src/VideoContent.tsx, and scene files).
   - Step 8: Verification & Render (run "typecheck", "test", "render", "probe_output").
   - Finally call "finish".
5. All file paths must be project-relative. Never read .env or expose secrets. Use report_stage as you advance. Use only the provided actions for commands. Do not claim success until render, tests, and independent probe succeed; then call finish.`,
  }];

  const candidateModels = modelCandidates(job.model);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    if (job.abortController.signal.aborted) throw new Error('Production cancelled.');
    appendLog(job, `ChatGPT · lượt xử lý ${round + 1}`, 'ai');

    let response;
    let lastError;
    const retryDelays = [2000, 4000, 7000, 12000];

    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      if (job.abortController.signal.aborted) throw new Error('Production cancelled.');
      const currentModel = attempt === 0 ? job.model : (candidateModels[attempt % candidateModels.length] || job.model);
      try {
        response = await client.responses.create({
          model: currentModel,
          instructions: `You are the production agent for this repository. Be rigorous, source-grounded, concise in logs, and persist until the requested video is verified. Step 1 setup is already completed; you must strictly use the assigned slug "${job.slug}" for all file operations and never re-derive or change the slug.`,
          input,
          tools: TOOLS,
          tool_choice: 'auto',
          parallel_tool_calls: false,
          store: false,
          include: ['reasoning.encrypted_content'],
        });
        if (currentModel !== job.model) {
          job.model = currentModel;
        }
        break;
      } catch (error) {
        lastError = error;
        const status = error?.status || error?.statusCode;
        const message = String(error?.message || '');
        const isTransient = isTransientAgentError(error);

        if (attempt < retryDelays.length && isTransient) {
          const delay = retryDelays[attempt];
          const nextModel = candidateModels[(attempt + 1) % candidateModels.length];
          const switchNotice = nextModel !== currentModel ? ` (thử model ${nextModel})` : '';
          appendLog(
            job,
            `⚠️ Server AI đang bận/quá tải (${status || error?.code || 'lỗi kết nối'}). Đang tự động thử lại sau ${Math.round(delay / 1000)}s${switchNotice} (lần ${attempt + 1}/${retryDelays.length})...`,
            'warn',
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw lastError;
        }
      }
    }

    input.push(...response.output);
    const calls = response.output.filter((item) => item.type === 'function_call');
    if (calls.length === 0) {
      if (job.agentFinished) return;
      throw new Error(response.output_text || 'ChatGPT stopped before completing the video.');
    }
    for (const call of calls) {
      let result;
      try {
        result = await executeTool({job, rootDir, name: call.name, args: JSON.parse(call.arguments), assemblyMutex});
      } catch (error) {
        appendLog(job, error.message, 'error');
        result = {ok: false, error: error.message};
      }
      input.push({type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result)});
    }
    if (job.agentFinished) return;
  }
  throw new Error(`ChatGPT exceeded ${MAX_TOOL_ROUNDS} tool rounds.`);
}

export async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.status = 400;
    throw error;
  }
}

export async function scanTemplateOptions(rootDir) {
  const source = await readFile(join(rootDir, 'src', 'templates', 'registry.ts'), 'utf8');
  const entries = [];
  const idPattern = /id:\s*["']([^"']+)["']/gu;
  for (const match of source.matchAll(idPattern)) {
    const start = source.lastIndexOf('{', match.index);
    let depth = 0;
    let quote = null;
    let escaped = false;
    let end = source.length;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === quote) quote = null;
        continue;
      }
      if (character === '"' || character === "'" || character === '`') quote = character;
      else if (character === '{') depth += 1;
      else if (character === '}' && --depth === 0) { end = index + 1; break; }
    }
    const block = source.slice(start, end);
    const name = block.match(/name:\s*["']([^"']+)["']/u)?.[1] ?? match[1];
    const behavior = block.match(/behavior:\s*["']([^"']+)["']/u)?.[1] ?? 'fixed';
    const description = block.match(/description:\s*(?:\n\s*)?["']([^"']+)["']/u)?.[1] ?? '';
    entries.push({id: match[1], name, behavior, description});
  }
  return entries;
}

export function createProductionManager({
  rootDir,
  runner = runOpenAiAgent,
  maxConcurrent = Math.max(1, Number(process.env.DASHBOARD_CONCURRENCY) || 2),
} = {}) {
  const projectRoot = resolve(rootDir ?? process.cwd());
  const jobs = new Map();
  const pendingQueue = [];
  let activeWorkers = 0;
  const assemblyMutex = new AssemblyMutex();

  function apiStatus() {
    return {
      connected: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
      ttsReady: Boolean(process.env.ELEVENLABS_API_KEY || process.env.GEMINI_API_KEY),
      sttReady: Boolean(process.env.GROQ_API_KEY || process.env.STT_API_KEY),
      concurrency: maxConcurrent,
      activeWorkers,
      queuedCount: pendingQueue.length,
    };
  }

  function schedule() {
    while (activeWorkers < maxConcurrent && pendingQueue.length > 0) {
      const job = pendingQueue.shift();
      if (job.abortController.signal.aborted) continue;
      activeWorkers += 1;
      executeJob(job).finally(() => {
        activeWorkers -= 1;
        schedule();
      });
    }
  }

  async function executeJob(job) {
    if (job.abortController.signal.aborted) return;
    job.status = 'running';
    job.startedAt = now();
    try {
      setStage(job, 'setup', 'Đang khởi tạo workspace video');
      await mkdir(join(projectRoot, 'videos', job.slug, 'script'), {recursive: true});
      await mkdir(join(projectRoot, 'videos', job.slug, 'output'), {recursive: true});
      await mkdir(join(projectRoot, 'public', job.slug), {recursive: true});
      await Promise.all([
        writeFile(join(projectRoot, 'videos', job.slug, 'context.txt'), `${job.context}\n`),
        writeFile(join(projectRoot, 'videos', job.slug, 'template.txt'), `${job.templateId}\n`),
        writeFile(join(projectRoot, 'videos', job.slug, 'audio.txt'), `${job.audioMode}\n`),
      ]);
      await runner(job, projectRoot, {assemblyMutex});
      job.status = 'completed';
      job.progress = 100;
      job.finishedAt = now();
      job.message = 'Video đã sẵn sàng';
      appendLog(job, 'Hoàn tất sản xuất video.', 'success');
    } catch (error) {
      job.status = job.abortController.signal.aborted ? 'cancelled' : 'failed';
      job.error = error.message;
      job.finishedAt = now();
      job.message = error.message;
      appendLog(job, error.message, 'error');
    } finally {
      if (job.releaseAssemblyLock) {
        job.releaseAssemblyLock();
        job.releaseAssemblyLock = null;
        job.hasAssemblyLock = false;
      }
    }
  }

  async function createSingleJob(payload) {
    const context = typeof payload?.context === 'string' ? payload.context.trim() : '';
    if (!context || context.length > 12000) {
      const error = new Error('Nội dung hoặc URL phải có từ 1 đến 12.000 ký tự.');
      error.status = 400;
      throw error;
    }
    if (!process.env.OPENAI_API_KEY) {
      const error = new Error('Chưa cấu hình OPENAI_API_KEY trên server.');
      error.status = 503;
      throw error;
    }
    const templates = await scanTemplateOptions(projectRoot);
    const tiktok = isTikTokShopUrl(context);
    const article = isPublicArticleUrl(context);
    const templateId = payload.templateId || (tiktok ? 'commerce/storytelling-showcase' : article ? 'news/media-showcase' : 'creative/free-style');
    if (!templates.some((template) => template.id === templateId)) {
      const error = new Error('Template không hợp lệ.');
      error.status = 400;
      throw error;
    }
    const audioMode = payload.audioMode || ((tiktok || article) ? 'full' : 'template');
    if (!AUDIO_MODES.has(audioMode)) {
      const error = new Error('Chế độ audio không hợp lệ.');
      error.status = 400;
      throw error;
    }
    let slug = deriveJobSlug(context);
    let suffix = 2;
    while ([...jobs.values()].some((job) => job.slug === slug)) slug = `${deriveJobSlug(context)}-${suffix++}`;
    try {
      await stat(join(projectRoot, 'videos', slug));
      slug = `${slug}-${Date.now().toString(36)}`;
    } catch {}

    const job = {
      id: crypto.randomUUID(), slug, context, templateId, audioMode,
      model: payload?.model || process.env.OPENAI_MODEL || 'gpt-5.6-terra', status: 'queued', stage: 'setup', progress: 0,
      message: 'Đang chờ lượt sản xuất', error: null, createdAt: now(), startedAt: null, finishedAt: null,
      logs: [], abortController: new AbortController(), child: null, agentFinished: false,
      hasAssemblyLock: false, releaseAssemblyLock: null, waitingForLock: false,
    };
    jobs.set(job.id, job);
    pendingQueue.push(job);
    schedule();
    return publicJob(job);
  }

  async function createJob(payload) {
    return createSingleJob(payload);
  }

  async function createJobs(payload) {
    const items = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.batch)
        ? payload.batch
        : Array.isArray(payload?.contexts)
          ? payload.contexts.map((ctx) => ({...payload, context: ctx}))
          : [payload];
    const created = [];
    for (const item of items) {
      created.push(await createSingleJob(item));
    }
    return created;
  }

  function listJobs() { return [...jobs.values()].reverse().map(publicJob); }
  function getJob(id) { return jobs.has(id) ? publicJob(jobs.get(id)) : null; }
  function cancelJob(id) {
    const job = jobs.get(id);
    if (!job || !ACTIVE_STATUSES.has(job.status)) return false;
    job.abortController.abort();
    job.child?.kill('SIGTERM');
    if (job.releaseAssemblyLock) {
      job.releaseAssemblyLock();
      job.releaseAssemblyLock = null;
      job.hasAssemblyLock = false;
    }
    job.status = 'cancelled'; job.finishedAt = now(); job.message = 'Đã huỷ sản xuất';
    appendLog(job, 'Đã huỷ theo yêu cầu.', 'error');
    return true;
  }

  async function retryJob(id) {
    const job = jobs.get(id);
    if (!job) {
      const error = new Error('Job không tồn tại.');
      error.status = 404;
      throw error;
    }
    if (ACTIVE_STATUSES.has(job.status)) {
      const error = new Error('Job đang chạy hoặc đang trong hàng đợi.');
      error.status = 409;
      throw error;
    }
    job.status = 'queued';
    job.stage = 'setup';
    job.progress = 0;
    job.message = 'Đang chờ lượt thử lại';
    job.error = null;
    job.startedAt = null;
    job.finishedAt = null;
    job.abortController = new AbortController();
    job.child = null;
    job.agentFinished = false;
    job.hasAssemblyLock = false;
    job.releaseAssemblyLock = null;
    job.waitingForLock = false;
    appendLog(job, 'Bắt đầu thử lại sản xuất video...', 'info');
    pendingQueue.push(job);
    schedule();
    return publicJob(job);
  }

  return {apiStatus, createJob, createJobs, listJobs, getJob, cancelJob, retryJob, stages: STAGES, maxConcurrent};
}
