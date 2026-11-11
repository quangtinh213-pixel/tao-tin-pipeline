#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = path.join(ROOT, 'src/templates/registry.ts');

const usage = `Usage: node scripts/update-bg-music.mjs --template <template-id-or-name> --music <music-file-or-path>

Examples:
  node scripts/update-bg-music.mjs --template news/current-affairs-dark --music news-ambient-01.mp3
  node scripts/update-bg-music.mjs --template current-affairs-dark --music assets/news/music/news-ambient-01.mp3`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--template' || arg === '--music') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}.\n${usage}`);
      }

      args[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--template=')) {
      args.template = arg.slice('--template='.length);
      continue;
    }

    if (arg.startsWith('--music=')) {
      args.music = arg.slice('--music='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  if (!args.template || !args.music) {
    throw new Error(usage);
  }

  return args;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escape = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error('Could not parse registry entry braces.');
}

function extractRegistryEntries(source) {
  const entries = [];
  const arrayStart = source.indexOf('export const TEMPLATE_REGISTRY');

  if (arrayStart === -1) {
    throw new Error('Could not find TEMPLATE_REGISTRY in src/templates/registry.ts.');
  }

  let index = source.indexOf('[', arrayStart);
  const arrayEnd = source.indexOf('];', index);

  if (index === -1 || arrayEnd === -1) {
    throw new Error('Could not find TEMPLATE_REGISTRY array bounds.');
  }

  while (index < arrayEnd) {
    const open = source.indexOf('{', index);

    if (open === -1 || open > arrayEnd) {
      break;
    }

    const close = findMatchingBrace(source, open);
    const text = source.slice(open, close + 1);
    const id = text.match(/\bid:\s*"([^"]+)"/)?.[1];
    const assetManifestPath = text.match(/\bassetManifestPath:\s*(?:"([^"]+)"|null)/)?.[1] ?? null;

    if (id) {
      entries.push({id, assetManifestPath, start: open, end: close + 1, text});
    }

    index = close + 1;
  }

  return entries;
}

function resolveTemplate(entries, templateInput) {
  const normalized = templateInput.trim();
  const matches = entries.filter((entry) => (
    entry.id === normalized ||
    entry.id.endsWith(`/${normalized}`) ||
    entry.id.split('/').at(-1) === normalized
  ));

  if (matches.length === 0) {
    throw new Error(`Template not found: ${templateInput}`);
  }

  if (matches.length > 1) {
    throw new Error(
      `Template "${templateInput}" is ambiguous. Use a full template ID:\n` +
      matches.map((entry) => `- ${entry.id}`).join('\n'),
    );
  }

  return matches[0];
}

function readManifest(manifestPath) {
  const absolutePath = path.join(ROOT, manifestPath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  return {
    manifestPath,
    music: (manifest.music ?? []).map((track) => ({...track, manifestPath})),
  };
}

function listManifestPaths() {
  const paths = [];
  const assetsRoot = path.join(ROOT, 'public/assets');

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const absolute = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.name === 'manifest.json') {
        paths.push(path.relative(ROOT, absolute));
      }
    }
  }

  walk(assetsRoot);
  return paths.sort();
}

function trackMatches(track, musicInput) {
  const normalized = musicInput.trim();

  return (
    track.path === normalized ||
    path.basename(track.path) === normalized ||
    track.path.endsWith(`/${normalized}`) ||
    track.id === normalized
  );
}

function resolveMusic(template, musicInput) {
  const searched = [];

  if (template.assetManifestPath) {
    const templateManifest = readManifest(template.assetManifestPath);
    searched.push(template.assetManifestPath);
    const matches = (templateManifest?.music ?? []).filter((track) => trackMatches(track, musicInput));

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      throw new Error(`Music "${musicInput}" matched multiple tracks in ${template.assetManifestPath}.`);
    }
  }

  const otherManifestPaths = listManifestPaths()
    .filter((manifestPath) => manifestPath !== template.assetManifestPath);
  const matches = [];

  for (const manifestPath of otherManifestPaths) {
    searched.push(manifestPath);
    const manifest = readManifest(manifestPath);
    matches.push(...(manifest?.music ?? []).filter((track) => trackMatches(track, musicInput)));
  }

  if (matches.length === 0) {
    throw new Error(
      `Music not found: ${musicInput}\nSearched manifests:\n` +
      searched.map((manifestPath) => `- ${manifestPath}`).join('\n'),
    );
  }

  const uniquePaths = [...new Set(matches.map((track) => track.path))];

  if (uniquePaths.length > 1) {
    throw new Error(
      `Music "${musicInput}" matched multiple tracks. Use a full path:\n` +
      matches.map((track) => `- ${track.path} (${track.manifestPath})`).join('\n'),
    );
  }

  return matches[0];
}

function updateDefaultBgMusic(source, template, musicPath) {
  const entryText = source.slice(template.start, template.end);
  const defaultRegex = /\bdefaultBgMusic:\s*(?:"[^"]*"|null),?/;

  if (defaultRegex.test(entryText)) {
    const updatedEntry = entryText.replace(defaultRegex, `defaultBgMusic: "${musicPath}",`);
    return source.slice(0, template.start) + updatedEntry + source.slice(template.end);
  }

  const assetLineRegex = /(\n\s*assetManifestPath:\s*(?:"[^"]+"|null),)/;
  const match = entryText.match(assetLineRegex);

  if (!match) {
    throw new Error(`Could not find assetManifestPath line for template ${template.id}.`);
  }

  const indent = match[1].match(/\n(\s*)assetManifestPath:/)?.[1] ?? '    ';
  const updatedEntry = entryText.replace(
    assetLineRegex,
    `$1\n${indent}defaultBgMusic: "${musicPath}",`,
  );

  return source.slice(0, template.start) + updatedEntry + source.slice(template.end);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const entries = extractRegistryEntries(source);
  const template = resolveTemplate(entries, args.template);
  const music = resolveMusic(template, args.music);
  const updated = updateDefaultBgMusic(source, template, music.path);

  fs.writeFileSync(REGISTRY_PATH, updated);

  console.log(`Updated ${template.id}`);
  console.log(`defaultBgMusic: ${music.path}`);
  console.log(`source manifest: ${music.manifestPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
