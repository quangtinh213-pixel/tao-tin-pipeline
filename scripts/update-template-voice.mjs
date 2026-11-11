#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = path.join(ROOT, 'src/templates/registry.ts');

const usage = `Usage: node scripts/update-template-voice.mjs --template <template-id-or-name> [--gemini <voice-name>] [--elevenlabs <voice-id>]

Examples:
  node scripts/update-template-voice.mjs --template human-insight/pexels-podcast-dark --gemini Achird
  node scripts/update-template-voice.mjs --template pexels-podcast-dark --elevenlabs K7ewtjKRNtwwt3lKQ6M0
  node scripts/update-template-voice.mjs --template pexels-podcast-dark --gemini Achird --elevenlabs K7ewtjKRNtwwt3lKQ6M0`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--template' || arg === '--gemini' || arg === '--elevenlabs') {
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

    if (arg.startsWith('--gemini=')) {
      args.gemini = arg.slice('--gemini='.length);
      continue;
    }

    if (arg.startsWith('--elevenlabs=')) {
      args.elevenlabs = arg.slice('--elevenlabs='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  if (!args.template || (!args.gemini && !args.elevenlabs)) {
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

    if (id) {
      entries.push({id, start: open, end: close + 1, text});
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

function replaceOrInsertVoiceField(voiceBlock, fieldName, value) {
  const fieldRegex = new RegExp(`\\b${fieldName}:\\s*"[^"]*",?`);
  const line = `${fieldName}: ${JSON.stringify(value)},`;

  if (fieldRegex.test(voiceBlock)) {
    return voiceBlock.replace(fieldRegex, line);
  }

  const closingBraceIndex = voiceBlock.lastIndexOf('}');
  if (closingBraceIndex === -1) {
    throw new Error('Could not parse voice block.');
  }

  const closingIndent = voiceBlock.match(/\n(\s*)\}/)?.[1] ?? '    ';
  const fieldIndent = voiceBlock.match(/\n(\s*)\w+:/)?.[1] ?? `${closingIndent}  `;
  const beforeClosingBrace = voiceBlock.slice(0, closingBraceIndex).replace(/\s*$/, '');

  return (
    beforeClosingBrace +
    `\n${fieldIndent}${line}\n${closingIndent}` +
    voiceBlock.slice(closingBraceIndex)
  );
}

function buildVoiceBlock(entryText, args) {
  const entryIndent = entryText.match(/\n(\s*)specDocPath:/)?.[1] ?? '    ';
  const fieldIndent = `${entryIndent}  `;
  const fields = [];

  if (args.elevenlabs) {
    fields.push(`${fieldIndent}elevenLabsVoiceId: ${JSON.stringify(args.elevenlabs)},`);
  }

  if (args.gemini) {
    fields.push(`${fieldIndent}geminiVoice: ${JSON.stringify(args.gemini)},`);
  }

  return `${entryIndent}voice: {\n${fields.join('\n')}\n${entryIndent}},`;
}

function updateTemplateVoice(source, template, args) {
  const entryText = source.slice(template.start, template.end);
  const voiceIndex = entryText.search(/\bvoice:\s*\{/);

  if (voiceIndex !== -1) {
    const voiceOpen = entryText.indexOf('{', voiceIndex);
    const voiceClose = findMatchingBrace(entryText, voiceOpen);
    let voiceBlock = entryText.slice(voiceIndex, voiceClose + 1);

    if (args.elevenlabs) {
      voiceBlock = replaceOrInsertVoiceField(voiceBlock, 'elevenLabsVoiceId', args.elevenlabs);
    }

    if (args.gemini) {
      voiceBlock = replaceOrInsertVoiceField(voiceBlock, 'geminiVoice', args.gemini);
    }

    const updatedEntry =
      entryText.slice(0, voiceIndex) +
      voiceBlock +
      entryText.slice(voiceClose + 1);

    return source.slice(0, template.start) + updatedEntry + source.slice(template.end);
  }

  const specLineRegex = /(\n\s*specDocPath:\s*"[^"]+",)/;
  const match = entryText.match(specLineRegex);

  if (!match) {
    throw new Error(`Could not find specDocPath line for template ${template.id}.`);
  }

  const updatedEntry = entryText.replace(
    specLineRegex,
    `$1\n${buildVoiceBlock(entryText, args)}`,
  );

  return source.slice(0, template.start) + updatedEntry + source.slice(template.end);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const entries = extractRegistryEntries(source);
  const template = resolveTemplate(entries, args.template);
  const updated = updateTemplateVoice(source, template, args);

  fs.writeFileSync(REGISTRY_PATH, updated);

  console.log(`Updated ${template.id}`);
  if (args.elevenlabs) console.log(`elevenLabsVoiceId: ${args.elevenlabs}`);
  if (args.gemini) console.log(`geminiVoice: ${args.gemini}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
