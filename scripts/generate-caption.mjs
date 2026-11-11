import {readdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {
  buildCaption,
  validateCaption,
} from './caption-rules.mjs';
import {resolveVideoDirectory} from './dashboard-data.mjs';

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function scriptSegmentsFromPayload(payload) {
  if (!Array.isArray(payload?.script)) return [];
  return payload.script
    .map((segment) => (typeof segment?.text === 'string' ? segment.text.trim() : ''))
    .filter(Boolean);
}

async function readCaptionInputs(videoDir) {
  const spec = await readJson(join(videoDir, 'spec.json'));
  const plan = await readJson(join(videoDir, 'plan.json'));
  const script = await readJson(join(videoDir, 'script', 'script.json'));
  const missing = [];

  if (!spec) missing.push('spec.json');
  if (!plan) missing.push('plan.json');
  if (!script) missing.push('script/script.json');
  if (!scriptSegmentsFromPayload(script).length) missing.push('script/script.json có nội dung');
  if (missing.length > 0) return {missing};

  return {
    spec,
    plan,
    scriptSegments: scriptSegmentsFromPayload(script),
    missing: [],
  };
}

function captionMetadata(inputs) {
  return {
    title: inputs.spec?.video?.title,
    date: inputs.spec?.video?.date,
    publisher: inputs.spec?.source?.publisher,
    planHook: inputs.plan?.hook,
    planEnding: inputs.plan?.ending,
    scriptSegments: inputs.scriptSegments,
  };
}

function existingCaptionIsValid(caption, inputs) {
  const metadata = captionMetadata(inputs);
  const result = validateCaption(caption, {
    title: metadata.title,
    hook: metadata.planHook,
    scriptText: metadata.scriptSegments.join(' '),
    publisher: metadata.publisher,
  });
  return result.valid;
}

export async function generateCaption(rootDir, slug, {force = false} = {}) {
  const projectRoot = resolve(rootDir ?? process.cwd());
  const videoDir = resolveVideoDirectory(join(projectRoot, 'videos'), slug);
  const inputs = await readCaptionInputs(videoDir);
  if (inputs.missing.length > 0) {
    throw new Error(`Không đủ dữ liệu để tạo caption cho ${slug}: ${inputs.missing.join(', ')}`);
  }

  const outputPath = join(videoDir, 'caption.txt');
  if (!force) {
    try {
      const existing = await readFile(outputPath, 'utf8');
      if (existingCaptionIsValid(existing, inputs)) return outputPath;
    } catch {
      // Generate the missing or unreadable artifact below.
    }
  }

  const caption = buildCaption(captionMetadata(inputs)).trimEnd();
  const validation = validateCaption(caption, {
    title: inputs.spec?.video?.title,
    hook: inputs.plan?.hook,
    scriptText: inputs.scriptSegments.join(' '),
    publisher: inputs.spec?.source?.publisher,
  });
  if (!validation.valid) {
    throw new Error(`Caption sinh ra không hợp lệ cho ${slug}: ${validation.errors.join(' ')}`);
  }

  await writeFile(outputPath, `${caption}\n`, 'utf8');
  return outputPath;
}

export async function generateAllCaptions(rootDir, {force = false} = {}) {
  const videosDir = join(resolve(rootDir ?? process.cwd()), 'videos');
  let entries;
  try {
    entries = await readdir(videosDir, {withFileTypes: true});
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const paths = [];
  for (const entry of entries.filter((candidate) => candidate.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    try {
      paths.push(await generateCaption(rootDir, entry.name, {force}));
    } catch (error) {
      if (/Không đủ dữ liệu để tạo caption/u.test(error?.message ?? '')) continue;
      throw error;
    }
  }
  return paths;
}

function usage() {
  return 'Dùng: node scripts/generate-caption.mjs [--root <dir>] <slug> [--force] hoặc --all [--force]';
}

function parseArgs(argv) {
  let rootDir = process.cwd();
  let force = false;
  let all = false;
  let slug = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--force') {
      force = true;
    } else if (arg === '--all') {
      all = true;
    } else if (arg === '--root') {
      rootDir = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(usage());
    } else if (!slug) {
      slug = arg;
    } else {
      throw new Error(usage());
    }
  }

  if (all === Boolean(slug)) throw new Error(usage());
  return {rootDir, force, all, slug};
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const paths = options.all
      ? await generateAllCaptions(options.rootDir, {force: options.force})
      : [await generateCaption(options.rootDir, options.slug, {force: options.force})];
    for (const path of paths) console.log(path);
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}
