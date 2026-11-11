#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS_ROOT = path.join(ROOT, 'public/assets');
const TMP_MUSIC_DIR = path.join(ROOT, 'tmp-music');

const usage = `Usage: node scripts/add-music.mjs --category <name> [--file <mp3-path>]

Examples:
  node scripts/add-music.mjs --category news
  node scripts/add-music.mjs --category creative --file ./music/music-bg-3.mp3`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--category' || arg === '--file') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}.\n${usage}`);
      }

      args[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--category=')) {
      args.category = arg.slice('--category='.length);
      continue;
    }

    if (arg.startsWith('--file=')) {
      args.file = arg.slice('--file='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  if (!args.category) {
    throw new Error(usage);
  }

  return args;
}

function resolveSourceFile(fileArg) {
  if (fileArg) {
    const directPath = path.resolve(fileArg);

    if (fs.existsSync(directPath)) {
      return directPath;
    }

    const tmpMusicPath = path.join(TMP_MUSIC_DIR, fileArg);

    if (fs.existsSync(tmpMusicPath)) {
      return tmpMusicPath;
    }

    return directPath;
  }

  if (!fs.existsSync(TMP_MUSIC_DIR)) {
    throw new Error(`tmp-music folder not found. Create ${path.relative(ROOT, TMP_MUSIC_DIR)} and put exactly one .mp3 file in it.`);
  }

  const mp3Files = fs.readdirSync(TMP_MUSIC_DIR)
    .filter((filename) => path.extname(filename).toLowerCase() === '.mp3')
    .sort();

  if (mp3Files.length === 0) {
    throw new Error('No .mp3 file found in tmp-music/. Put exactly one .mp3 file there and rerun.');
  }

  if (mp3Files.length > 1) {
    throw new Error(
      'Multiple .mp3 files found in tmp-music/. Keep exactly one file or pass --file explicitly:\n' +
      mp3Files.map((filename) => `- ${filename}`).join('\n'),
    );
  }

  return path.join(TMP_MUSIC_DIR, mp3Files[0]);
}

function makeTrackId(filename) {
  return path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

try {
  const args = parseArgs(process.argv.slice(2));
  const category = args.category.trim();
  const sourcePath = resolveSourceFile(args.file);

  if (!/^[a-z0-9-]+$/.test(category)) {
    throw new Error(`Invalid category "${category}". Use the folder name under public/assets.`);
  }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`MP3 file not found: ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== '.mp3') {
    throw new Error(`File must be an .mp3: ${sourcePath}`);
  }

  const categoryDir = path.join(ASSETS_ROOT, category);
  const manifestPath = path.join(categoryDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Asset category not found: ${category}. Expected ${path.relative(ROOT, manifestPath)}.`);
  }

  const musicDir = path.join(categoryDir, 'music');
  const filename = path.basename(sourcePath);
  const destPath = path.join(musicDir, filename);
  const assetPath = `assets/${category}/music/${filename}`;
  const trackId = makeTrackId(filename);

  if (!trackId) {
    throw new Error(`Could not derive a valid track id from filename: ${filename}`);
  }

  if (fs.existsSync(destPath)) {
    throw new Error(`Music file already exists: ${path.relative(ROOT, destPath)}`);
  }

  const manifest = readManifest(manifestPath);
  const music = manifest.music ?? [];

  if (!Array.isArray(music)) {
    throw new Error(`manifest.music must be an array in ${path.relative(ROOT, manifestPath)}.`);
  }

  if (music.some((track) => track.id === trackId)) {
    throw new Error(`Music id already exists in ${path.relative(ROOT, manifestPath)}: ${trackId}`);
  }

  if (music.some((track) => track.path === assetPath)) {
    throw new Error(`Music path already exists in ${path.relative(ROOT, manifestPath)}: ${assetPath}`);
  }

  fs.mkdirSync(musicDir, {recursive: true});
  fs.copyFileSync(sourcePath, destPath);

  manifest.music = [
    ...music,
    {
      id: trackId,
      path: assetPath,
      volume: 0.1,
      desc: 'Background music',
      mood: ['general'],
    },
  ];

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Added music asset to ${category}`);
  console.log(`id: ${trackId}`);
  console.log(`path: ${assetPath}`);
  console.log(`file: ${path.relative(ROOT, destPath)}`);
  console.log(`manifest: ${path.relative(ROOT, manifestPath)}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
