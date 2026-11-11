#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ENV_PATH = path.join(ROOT, '.env');

const usage = `Usage: node scripts/update-config.mjs --key <ENV_KEY> --value <value>

Examples:
  node scripts/update-config.mjs --key ELEVENLABS_API_KEY --value abc-xyz-kkk
  node scripts/update-config.mjs --key SHOW_SUBTITLES --value false`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--key' || arg === '--value' || arg === '--env-file') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}.\n${usage}`);
      }

      args[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--key=')) {
      args.key = arg.slice('--key='.length);
      continue;
    }

    if (arg.startsWith('--value=')) {
      args.value = arg.slice('--value='.length);
      continue;
    }

    if (arg.startsWith('--env-file=')) {
      args['env-file'] = arg.slice('--env-file='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  if (!args.key || args.value === undefined) {
    throw new Error(usage);
  }

  return args;
}

function formatEnvValue(value) {
  if (/^[A-Za-z0-9_./:@+=,-]*$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}

function updateEnv(source, key, value) {
  const lines = source.length > 0 ? source.split(/\r?\n/) : [];
  const lineRegex = new RegExp(`^\\s*${key}\\s*=`);
  const nextLine = `${key}=${formatEnvValue(value)}`;
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!updated && lineRegex.test(line)) {
      updated = true;
      return nextLine;
    }

    return line;
  });

  if (!updated) {
    if (nextLines.length > 0 && nextLines.at(-1) !== '') {
      nextLines.push('');
    }

    nextLines.push(nextLine);
  }

  return {source: `${nextLines.join('\n').replace(/\n+$/, '')}\n`, updated};
}

try {
  const args = parseArgs(process.argv.slice(2));
  const key = args.key.trim();

  if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
    throw new Error(`Invalid env key "${args.key}". Use uppercase letters, numbers, and underscores.`);
  }

  const envPath = args['env-file'] ? path.resolve(args['env-file']) : DEFAULT_ENV_PATH;
  const source = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const result = updateEnv(source, key, args.value);

  fs.writeFileSync(envPath, result.source);

  console.log(`${result.updated ? 'Updated' : 'Added'} ${key} in ${path.relative(ROOT, envPath) || '.env'}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
