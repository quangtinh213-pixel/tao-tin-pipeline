#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP_LOGO_DIR = path.join(ROOT, 'tmp-logo');
const WATERMARK_PATH = path.join(ROOT, 'public/watermark.png');

const usage = `Usage: node scripts/update-logo.mjs [--file <png-path-or-filename>]

Examples:
  node scripts/update-logo.mjs
  node scripts/update-logo.mjs --file logo.png`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--file') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for --file.\n${usage}`);
      }

      args.file = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--file=')) {
      args.file = arg.slice('--file='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  return args;
}

function resolveSourceFile(fileArg) {
  if (fileArg) {
    const directPath = path.resolve(fileArg);

    if (fs.existsSync(directPath)) {
      return directPath;
    }

    const tmpLogoPath = path.join(TMP_LOGO_DIR, fileArg);

    if (fs.existsSync(tmpLogoPath)) {
      return tmpLogoPath;
    }

    return directPath;
  }

  if (!fs.existsSync(TMP_LOGO_DIR)) {
    throw new Error(`tmp-logo folder not found. Create ${path.relative(ROOT, TMP_LOGO_DIR)} and put exactly one .png file in it.`);
  }

  const pngFiles = fs.readdirSync(TMP_LOGO_DIR)
    .filter((filename) => path.extname(filename).toLowerCase() === '.png')
    .sort();

  if (pngFiles.length === 0) {
    throw new Error('No .png file found in tmp-logo/. Put exactly one .png file there and rerun.');
  }

  if (pngFiles.length > 1) {
    throw new Error(
      'Multiple .png files found in tmp-logo/. Keep exactly one file or pass --file explicitly:\n' +
      pngFiles.map((filename) => `- ${filename}`).join('\n'),
    );
  }

  return path.join(TMP_LOGO_DIR, pngFiles[0]);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = resolveSourceFile(args.file);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Logo file not found: ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== '.png') {
    throw new Error(`Logo file must be a .png because templates render public/watermark.png: ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, WATERMARK_PATH);

  console.log('Updated logo watermark');
  console.log(`source: ${path.relative(ROOT, sourcePath)}`);
  console.log(`target: ${path.relative(ROOT, WATERMARK_PATH)}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
