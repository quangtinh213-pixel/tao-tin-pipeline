#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_FILE = path.join(ROOT, 'update-version/update-version.md');

const usage = `Usage: node scripts/update-version.mjs [--file <path>] [--mark-updated]

Examples:
  node scripts/update-version.mjs
  node scripts/update-version.mjs --mark-updated`;

function parseArgs(argv) {
  const args = {markUpdated: false};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--mark-updated') {
      args.markUpdated = true;
      continue;
    }

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

function hasUpdatedStatus(source) {
  return source.split(/\r?\n/).slice(0, 40).some((line) => (
    /^\s*status\s*:\s*updated\s*$/i.test(line) ||
    /^\s*status\s+updated\s*$/i.test(line) ||
    /^\s*<!--\s*status\s*:\s*updated\s*-->\s*$/i.test(line)
  ));
}

function markUpdated(source) {
  const lines = source.split(/\r?\n/);
  const statusIndex = lines.findIndex((line) => /^\s*status\s*:/.test(line));

  if (statusIndex !== -1) {
    lines[statusIndex] = 'status: updated';
    return `${lines.join('\n').replace(/\n+$/, '')}\n`;
  }

  return `status: updated\n\n${source.replace(/\n+$/, '')}\n`;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file ? path.resolve(args.file) : DEFAULT_FILE;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Update version file not found: ${path.relative(ROOT, filePath)}`);
  }

  const source = fs.readFileSync(filePath, 'utf8');

  if (args.markUpdated) {
    fs.writeFileSync(filePath, markUpdated(source));
    console.log(`Marked updated: ${path.relative(ROOT, filePath)}`);
    process.exit(0);
  }

  if (hasUpdatedStatus(source)) {
    console.log(`Already updated: ${path.relative(ROOT, filePath)}`);
    process.exit(0);
  }

  console.log(`Pending update instructions: ${path.relative(ROOT, filePath)}`);
  process.exit(2);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
