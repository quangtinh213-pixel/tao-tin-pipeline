#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOAD_DIR = path.join(ROOT, 'load-templates');
const STATE_PATH = path.join(ROOT, '.template-sync-state.json');
const REGISTRY_PATH = path.join(ROOT, 'src/templates/registry.ts');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const PACKAGE_LOCK_PATH = path.join(ROOT, 'package-lock.json');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');
const ENV_PATH = path.join(ROOT, '.env');
const BACKUP_ROOT = path.join(ROOT, '.template-sync-backups');
const BASE_ROOT = path.join(ROOT, '.template-sync-bases');

const usage = `Usage: node scripts/sync-templates.mjs [--package <package-folder>] [--skip-install] [--dry-run] [--fail-fast]

Examples:
  node scripts/sync-templates.mjs
  node scripts/sync-templates.mjs --package news-real-estate-luxury-editorial
  node scripts/sync-templates.mjs --package news-real-estate-luxury-editorial --dry-run`;

function parseArgs(argv) {
  const args = {skipInstall: false, dryRun: false, failFast: false};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--skip-install') args.skipInstall = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--fail-fast') args.failFast = true;
    else if (arg === '--package') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --package.\n${usage}`);
      args.package = value;
      index += 1;
    } else if (arg.startsWith('--package=')) args.package = arg.slice('--package='.length);
    else throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }

  return args;
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function jsonBuffer(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  const buffer = Buffer.isBuffer(value) ? value : fs.readFileSync(value);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function assertRelativePath(value, label) {
  if (
    !value ||
    typeof value !== 'string' ||
    path.isAbsolute(value) ||
    value.split(/[\\/]+/).includes('..')
  ) {
    throw new Error(`${label} must be a safe relative path: ${value}`);
  }
}

function resolveInside(root, relativePath, label) {
  assertRelativePath(relativePath, label);
  const resolved = path.resolve(root, relativePath);
  const rootWithSep = `${path.resolve(root)}${path.sep}`;
  if (resolved !== path.resolve(root) && !resolved.startsWith(rootWithSep)) {
    throw new Error(`${label} escapes ${root}: ${relativePath}`);
  }
  return resolved;
}

function normalizeRel(value) {
  return value.split(path.sep).join('/');
}

function isTextBuffer(buffer) {
  if (buffer.includes(0)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte < 7 || (byte > 13 && byte < 32)) suspicious += 1;
  }
  return suspicious / Math.max(sample.length, 1) < 0.01;
}

function kindForPath(
  destRel,
  manifestPaths,
  referenceDocPaths,
  templateId,
  specDocPath,
  entry = {},
) {
  if (entry.kind) return entry.kind;
  if (manifestPaths.has(destRel)) return 'asset-manifest';
  if (referenceDocPaths.has(destRel)) return 'reference-doc';
  if (/^scripts\/capabilities\/[^/]+\/v\d+\//.test(destRel)) return 'immutable-capability';
  if (/^public\/assets\/.+\/manifest\.json$/.test(destRel)) return 'asset-manifest';
  if (destRel.startsWith('public/assets/')) return 'asset';
  if (destRel.startsWith(`src/templates/${templateId}/`)) return 'template-source';
  if (destRel.startsWith('src/templates/')) return 'shared-source';
  if (destRel === specDocPath) return 'template-spec';
  if (destRel.startsWith('docs/templates/')) return 'reference-doc';
  if (destRel.endsWith('.md')) return 'reference-doc';
  return 'shared-source';
}

function ownershipForKind(kind, entry = {}) {
  if (entry.ownership) return entry.ownership;
  if (kind === 'template-source' || kind === 'template-spec') return 'exclusive';
  if (kind === 'immutable-capability') return 'immutable';
  return 'shared';
}

function expandFileEntry(
  packageDir,
  fileEntry,
  manifestPaths,
  referenceDocPaths,
  templateId,
  specDocPath,
) {
  const entry = typeof fileEntry === 'string' ? {from: fileEntry, to: fileEntry} : fileEntry;
  const sourceRel = normalizeRel(entry.from);
  const destRel = normalizeRel(entry.to ?? entry.from);
  const sourcePath = resolveInside(packageDir, sourceRel, 'file.from');
  resolveInside(ROOT, destRel, 'file.to');

  if (!fs.existsSync(sourcePath)) throw new Error(`Package file not found: ${sourceRel}`);
  const stat = fs.lstatSync(sourcePath);
  if (stat.isSymbolicLink()) throw new Error(`Package symlinks are not allowed: ${sourceRel}`);

  if (stat.isDirectory()) {
    return fs.readdirSync(sourcePath, {withFileTypes: true}).flatMap((child) => (
      expandFileEntry(
        packageDir,
        {
          ...entry,
          from: normalizeRel(path.join(sourceRel, child.name)),
          to: normalizeRel(path.join(destRel, child.name)),
          sha256: undefined,
        },
        manifestPaths,
        referenceDocPaths,
        templateId,
        specDocPath,
      )
    ));
  }

  const contents = fs.readFileSync(sourcePath);
  if (entry.sha256 && entry.sha256.replace(/^sha256:/, '') !== sha256(contents)) {
    throw new Error(`Checksum mismatch for package file: ${sourceRel}`);
  }

  const kind = kindForPath(
    destRel,
    manifestPaths,
    referenceDocPaths,
    templateId,
    specDocPath,
    entry,
  );
  return [{
    ...entry,
    sourceRel,
    destRel,
    sourcePath,
    contents,
    kind,
    ownership: ownershipForKind(kind, entry),
  }];
}

function parseVersion(value) {
  const match = String(value ?? '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function validateCompatibility(pkg) {
  const requirement = pkg.compatibility?.premium;
  if (!requirement || !requirement.startsWith('>=')) return;
  const minimum = parseVersion(requirement.slice(2));
  const current = parseVersion(readJson(PACKAGE_JSON_PATH, {}).version);
  if (minimum && current && compareVersions(current, minimum) < 0) {
    throw new Error(
      `Incompatible Premium runtime: package requires ${requirement}, current version is ${current.join('.')}.`,
    );
  }
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escape = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escape) escape = false;
      else if (char === '\\') escape = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return index;
  }
  throw new Error('Could not parse registry entry braces.');
}

function extractRegistryEntries(source) {
  const entries = [];
  const arrayStart = source.indexOf('export const TEMPLATE_REGISTRY');
  const arrayOpen = source.indexOf('[', arrayStart);
  const arrayClose = source.indexOf('];', arrayOpen);
  if (arrayStart === -1 || arrayOpen === -1 || arrayClose === -1) {
    throw new Error('Could not find TEMPLATE_REGISTRY array bounds.');
  }
  let index = arrayOpen;
  while (index < arrayClose) {
    const open = source.indexOf('{', index);
    if (open === -1 || open > arrayClose) break;
    const close = findMatchingBrace(source, open);
    const text = source.slice(open, close + 1);
    const id = text.match(/\bid:\s*["']([^"']+)["']/)?.[1];
    if (id) entries.push({id, text, start: open, end: close + 1});
    index = close + 1;
  }
  return {entries, arrayClose};
}

function textStringField(text, key) {
  return text.match(new RegExp(`\\b${key}:\\s*["']([^"']*)["']`))?.[1];
}

function textNullableStringField(text, key) {
  const match = text.match(new RegExp(`\\b${key}:\\s*(?:["']([^"']*)["']|null)`));
  return match ? (match[1] ?? null) : undefined;
}

function parseRegistryEntryText(text) {
  const voiceText = text.match(/\bvoice:\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
  const entry = {};
  for (const key of ['id', 'behavior', 'name', 'category', 'description', 'aspectRatio', 'specDocPath']) {
    const value = textStringField(text, key);
    if (value !== undefined) entry[key] = value;
  }
  entry.assetManifestPath = textNullableStringField(text, 'assetManifestPath') ?? null;
  const defaultBgMusic = textNullableStringField(text, 'defaultBgMusic');
  if (defaultBgMusic !== undefined) entry.defaultBgMusic = defaultBgMusic;
  const elevenLabsVoiceId = textStringField(voiceText, 'elevenLabsVoiceId');
  const geminiVoice = textStringField(voiceText, 'geminiVoice');
  if (elevenLabsVoiceId || geminiVoice) {
    entry.voice = {};
    if (elevenLabsVoiceId) entry.voice.elevenLabsVoiceId = elevenLabsVoiceId;
    if (geminiVoice) entry.voice.geminiVoice = geminiVoice;
  }
  return entry;
}

function registryEntryFromPackage(pkg) {
  if (pkg.registryEntry) return structuredClone(pkg.registryEntry);
  if (pkg.registryEntryText) return parseRegistryEntryText(pkg.registryEntryText);
  throw new Error(`Package ${pkg.packageId} is missing registryEntry or registryEntryText.`);
}

function registryEntryToText(entry) {
  const lines = [
    '{',
    `    id: ${JSON.stringify(entry.id)},`,
    `    behavior: ${JSON.stringify(entry.behavior)},`,
    `    name: ${JSON.stringify(entry.name)},`,
    `    category: ${JSON.stringify(entry.category)},`,
    `    description: ${JSON.stringify(entry.description)},`,
    `    aspectRatio: ${JSON.stringify(entry.aspectRatio)},`,
    `    assetManifestPath: ${entry.assetManifestPath === null ? 'null' : JSON.stringify(entry.assetManifestPath)},`,
  ];
  if (entry.defaultBgMusic !== undefined) {
    lines.push(`    defaultBgMusic: ${entry.defaultBgMusic === null ? 'null' : JSON.stringify(entry.defaultBgMusic)},`);
  }
  lines.push(`    specDocPath: ${JSON.stringify(entry.specDocPath)},`);
  if (entry.voice && Object.keys(entry.voice).length > 0) {
    lines.push('    voice: {');
    if (entry.voice.elevenLabsVoiceId) {
      lines.push(`      elevenLabsVoiceId: ${JSON.stringify(entry.voice.elevenLabsVoiceId)},`);
    }
    if (entry.voice.geminiVoice) lines.push(`      geminiVoice: ${JSON.stringify(entry.voice.geminiVoice)},`);
    lines.push('    },');
  }
  lines.push('  }');
  return lines.join('\n');
}

function replaceStrings(value, rewrites) {
  if (typeof value === 'string') {
    let result = value;
    for (const [from, to] of rewrites) {
      result = from.includes('/') ? result.split(from).join(to) : (result === from ? to : result);
    }
    return result;
  }
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, rewrites));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, replaceStrings(child, rewrites)]),
    );
  }
  return value;
}

function safeSuffix(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function storageKey(value) {
  return `${safeSuffix(value)}-${sha256(Buffer.from(value)).slice(0, 8)}`;
}

function namespacedPath(destRel, packageId, contents) {
  const parsed = path.posix.parse(destRel);
  const suffix = safeSuffix(packageId);
  let candidate = path.posix.join(parsed.dir, `${parsed.name}--${suffix}${parsed.ext}`);
  const candidatePath = resolveInside(ROOT, candidate, 'namespaced asset path');
  if (!fs.existsSync(candidatePath) || sha256(candidatePath) === sha256(contents)) return candidate;
  candidate = path.posix.join(parsed.dir, `${parsed.name}--${suffix}-${sha256(contents).slice(0, 8)}${parsed.ext}`);
  return candidate;
}

function allIdentityCollisions(items, incoming) {
  return items.filter((existing) => (
    ['id', 'path', 'name'].some((key) => (
      incoming?.[key] !== undefined &&
      existing?.[key] !== undefined &&
      incoming[key] === existing[key]
    ))
  ));
}

function namespaceManifestItem(item, packageId, occupied, rewrites) {
  const result = structuredClone(item);
  const suffix = safeSuffix(packageId);
  for (const key of ['id', 'name']) {
    if (result?.[key] === undefined) continue;
    const oldValue = String(result[key]);
    let nextValue = `${oldValue}--${suffix}`;
    let counter = 2;
    while (occupied.some((entry) => entry?.[key] === nextValue)) nextValue = `${oldValue}--${suffix}-${counter++}`;
    rewrites.set(oldValue, nextValue);
    result[key] = nextValue;
  }
  return result;
}

function mergeOwnedValue(local, base, incoming, warnings, location) {
  if (stableJson(local) === stableJson(base)) return structuredClone(incoming);
  if (stableJson(incoming) === stableJson(base) || stableJson(local) === stableJson(incoming)) {
    return structuredClone(local);
  }
  if (
    local && base && incoming &&
    typeof local === 'object' && typeof base === 'object' && typeof incoming === 'object' &&
    !Array.isArray(local) && !Array.isArray(base) && !Array.isArray(incoming)
  ) {
    const result = {};
    for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(incoming)])) {
      result[key] = mergeOwnedValue(local[key], base[key], incoming[key], warnings, `${location}.${key}`);
    }
    return result;
  }
  warnings.push(`Preserved local manifest value at ${location}.`);
  return structuredClone(local);
}

function mergeManifestValues(
  targetManifest,
  sourceManifest,
  previousManifest,
  packageId,
  rewrites,
  warnings,
  counters,
) {
  const result = structuredClone(targetManifest);
  for (const [key, rawValue] of Object.entries(sourceManifest)) {
    const value = replaceStrings(rawValue, rewrites);
    if (!Array.isArray(value)) {
      if (result[key] === undefined) result[key] = value;
      else if (previousManifest?.[key] !== undefined) {
        result[key] = mergeOwnedValue(
          result[key],
          previousManifest[key],
          value,
          warnings,
          key,
        );
      }
      else if (key === 'note') {
        if (result[key] !== value) warnings.push(`Preserved local manifest note for ${key}.`);
      } else if (stableJson(result[key]) !== stableJson(value)) {
        warnings.push(`Preserved existing shared manifest field "${key}".`);
      }
      continue;
    }

    const current = Array.isArray(result[key]) ? result[key] : [];
    for (let itemIndex = 0; itemIndex < value.length; itemIndex += 1) {
      const rawItem = value[itemIndex];
      let item = rawItem;
      const baseItem = Array.isArray(previousManifest?.[key])
        ? previousManifest[key][itemIndex]
        : undefined;
      if (baseItem !== undefined) {
        const ownedIndex = current.findIndex((existing) => (
          stableJson(existing) === stableJson(baseItem) ||
          allIdentityCollisions([existing], baseItem).length > 0
        ));
        if (ownedIndex !== -1) {
          current[ownedIndex] = mergeOwnedValue(
            current[ownedIndex],
            baseItem,
            item,
            warnings,
            `${key}[${itemIndex}]`,
          );
          counters.updatedManifestItems += 1;
          continue;
        }
      }
      let collisions = allIdentityCollisions(current, item);
      if (collisions.length === 0) {
        current.push(item);
        counters.addedManifestItems += 1;
        continue;
      }
      if (collisions.some((existing) => stableJson(existing) === stableJson(item))) {
        counters.skippedManifestItems += 1;
        continue;
      }
      item = namespaceManifestItem(item, packageId, current, rewrites);
      item = replaceStrings(item, rewrites);
      collisions = allIdentityCollisions(current, item);
      if (collisions.length > 0) {
        throw new Error(`Manifest item in "${key}" cannot be namespaced safely.`);
      }
      current.push(item);
      counters.namespacedManifestItems += 1;
      warnings.push(`Namespaced a conflicting "${key}" manifest item for ${packageId}.`);
    }
    result[key] = current;
  }
  return result;
}

function threeWayMerge(local, base, incoming) {
  if (!isTextBuffer(local) || !isTextBuffer(base) || !isTextBuffer(incoming)) return null;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-merge-'));
  try {
    const localPath = path.join(tempDir, 'local');
    const basePath = path.join(tempDir, 'base');
    const incomingPath = path.join(tempDir, 'incoming');
    fs.writeFileSync(localPath, local);
    fs.writeFileSync(basePath, base);
    fs.writeFileSync(incomingPath, incoming);
    const result = spawnSync('git', ['merge-file', '-p', localPath, basePath, incomingPath], {
      encoding: null,
      maxBuffer: 20 * 1024 * 1024,
    });
    return result.status === 0 ? result.stdout : null;
  } finally {
    fs.rmSync(tempDir, {recursive: true, force: true});
  }
}

function normalizeDependencyMap(dependencies) {
  if (!dependencies) return {};
  if (Array.isArray(dependencies.npm)) {
    return Object.fromEntries(dependencies.npm.map((name) => [name, 'latest']));
  }
  return dependencies.npm ?? {};
}

function satisfiesSimpleRange(actualValue, rangeValue) {
  const actual = parseVersion(actualValue);
  const range = String(rangeValue ?? '').trim();
  if (!actual || range === '' || range === 'latest' || range === '*') return true;
  const wanted = parseVersion(range.replace(/^[~^<>=\s]+/, ''));
  if (!wanted) return false;
  if (range.startsWith('^')) {
    return actual[0] === wanted[0] && compareVersions(actual, wanted) >= 0;
  }
  if (range.startsWith('~')) {
    return actual[0] === wanted[0] && actual[1] === wanted[1] &&
      compareVersions(actual, wanted) >= 0;
  }
  if (range.startsWith('>=')) return compareVersions(actual, wanted) >= 0;
  if (range.startsWith('>')) return compareVersions(actual, wanted) > 0;
  if (range.startsWith('<=')) return compareVersions(actual, wanted) <= 0;
  if (range.startsWith('<')) return compareVersions(actual, wanted) < 0;
  return compareVersions(actual, wanted) === 0;
}

function dependencyPlan(pkg) {
  const wanted = normalizeDependencyMap(pkg.dependencies);
  const packageJson = readJson(PACKAGE_JSON_PATH, {});
  const installed = {...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {})};
  const packageLock = readJson(PACKAGE_LOCK_PATH, {});
  const missing = [];
  for (const [name, version] of Object.entries(wanted)) {
    if (installed[name] === undefined) {
      missing.push([name, version]);
      continue;
    }
    const actual = packageLock.packages?.[`node_modules/${name}`]?.version;
    if (actual && !satisfiesSimpleRange(actual, version)) {
      throw new Error(
        `Dependency conflict: ${name}@${actual} does not satisfy template requirement ${version}.`,
      );
    }
  }
  return missing;
}

function envUpdates(envEntries, counters) {
  if (!Array.isArray(envEntries)) return [];
  const normalized = envEntries
    .map((entry) => typeof entry === 'string' ? {key: entry} : entry)
    .filter((entry) => entry?.key);
  const updates = [];
  for (const targetPath of [ENV_EXAMPLE_PATH, ENV_PATH]) {
    let source = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
    let changed = false;
    for (const entry of normalized) {
      const key = entry.key.trim();
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) throw new Error(`Invalid env key: ${key}`);
      if (new RegExp(`^\\s*${key}\\s*=`, 'm').test(source)) continue;
      const description = entry.description ? `# ${entry.description}\n` : '';
      const value = targetPath === ENV_EXAMPLE_PATH ? (entry.defaultValue ?? '') : '';
      const prefix = source.length > 0 && !source.endsWith('\n') ? '\n' : '';
      source += `${prefix}${description}${key}=${value}\n`;
      changed = true;
      counters.addedEnvKeys += 1;
    }
    if (changed) updates.push({destRel: normalizeRel(path.relative(ROOT, targetPath)), contents: Buffer.from(source)});
  }
  return updates;
}

function legacyStatePackage(state, pkg) {
  const key = `${pkg.packageId}@${pkg.version}`;
  if (!state.packages?.[pkg.packageId] && state.synced?.[key]) {
    return {installedVersion: pkg.version, templateId: pkg.templateId, files: {}};
  }
  return state.packages?.[pkg.packageId] ?? null;
}

function buildPlan(packageDir, pkg, state, counters, args) {
  validateCompatibility(pkg);
  if (pkg.schemaVersion !== undefined && pkg.schemaVersion !== 1) {
    throw new Error(`Unsupported template package schemaVersion: ${pkg.schemaVersion}`);
  }
  const templateId = pkg.templateId ?? pkg.registryEntry?.id;
  if (!pkg.packageId || !pkg.version || !templateId) throw new Error('Invalid template package manifest.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(pkg.packageId)) {
    throw new Error(`Invalid packageId: ${pkg.packageId}`);
  }
  if (!/^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(pkg.version)) {
    throw new Error(`Invalid package version: ${pkg.version}`);
  }
  assertRelativePath(templateId, 'templateId');
  const rawRegistryEntry = registryEntryFromPackage(pkg);
  if (rawRegistryEntry.id !== templateId) {
    throw new Error(`registryEntry.id must match templateId: ${rawRegistryEntry.id} !== ${templateId}`);
  }
  if (rawRegistryEntry.specDocPath) {
    assertRelativePath(rawRegistryEntry.specDocPath, 'registryEntry.specDocPath');
  }
  if (rawRegistryEntry.assetManifestPath) {
    assertRelativePath(rawRegistryEntry.assetManifestPath, 'registryEntry.assetManifestPath');
  }
  const specDocPath = normalizeRel(
    rawRegistryEntry.specDocPath ?? `docs/templates/${templateId}.md`,
  );

  const previous = legacyStatePackage(state, pkg);
  if (
    previous?.installedVersion === pkg.version &&
    !(previous.dependenciesPending && !args.skipInstall)
  ) {
    return {alreadySynced: true, stateKey: `${pkg.packageId}@${pkg.version}`};
  }

  const manifestEntries = pkg.assets?.manifests ?? [];
  const referenceEntries = pkg.docs?.referenceFiles ?? [];
  const manifestPaths = new Set(manifestEntries.map((entry) => normalizeRel(
    typeof entry === 'string' ? entry : (entry.to ?? entry.from),
  )));
  const referenceDocPaths = new Set(referenceEntries.map((entry) => normalizeRel(
    typeof entry === 'string' ? entry : (entry.to ?? entry.from),
  )));

  const explicitEntries = [...(pkg.files ?? [])];
  for (const entry of [...manifestEntries, ...referenceEntries]) {
    const source = typeof entry === 'string' ? entry : entry.from;
    const destination = typeof entry === 'string' ? entry : (entry.to ?? entry.from);
    if (!explicitEntries.some((candidate) => {
      const candidateSource = typeof candidate === 'string' ? candidate : candidate.from;
      const candidateDest = typeof candidate === 'string' ? candidate : (candidate.to ?? candidate.from);
      return normalizeRel(candidateSource) === normalizeRel(source) &&
        normalizeRel(candidateDest) === normalizeRel(destination);
    })) explicitEntries.push(entry);
  }

  let files = explicitEntries.flatMap((entry) => (
    expandFileEntry(
      packageDir,
      entry,
      manifestPaths,
      referenceDocPaths,
      templateId,
      specDocPath,
    )
  ));
  const destinations = new Set();
  for (const file of files) {
    if (destinations.has(file.destRel)) throw new Error(`Duplicate package destination: ${file.destRel}`);
    destinations.add(file.destRel);
  }

  const warnings = [];
  const rewrites = new Map();
  for (const file of files) {
    if (file.kind !== 'asset') continue;
    const destination = resolveInside(ROOT, file.destRel, 'asset destination');
    if (!fs.existsSync(destination) || sha256(destination) === sha256(file.contents)) continue;
    const owned = previous?.files?.[file.destRel];
    if (owned?.installedHash === sha256(destination)) continue;
    const original = file.destRel;
    file.destRel = namespacedPath(file.destRel, pkg.packageId, file.contents);
    const publicOriginal = original.startsWith('public/') ? original.slice('public/'.length) : original;
    const publicNext = file.destRel.startsWith('public/') ? file.destRel.slice('public/'.length) : file.destRel;
    rewrites.set(original, file.destRel);
    rewrites.set(publicOriginal, publicNext);
    warnings.push(`Namespaced conflicting asset ${original} -> ${file.destRel}.`);
    counters.namespacedAssets += 1;
  }

  let incomingRegistry = replaceStrings(rawRegistryEntry, rewrites);
  const manifestFiles = new Map(files.filter((file) => file.kind === 'asset-manifest').map((file) => [file.destRel, file]));
  const manifestWrites = [];
  const manifestBaselines = {};
  for (const [destRel, file] of manifestFiles) {
    const destination = resolveInside(ROOT, destRel, 'manifest destination');
    const target = readJson(destination, {});
    const source = replaceStrings(JSON.parse(file.contents.toString('utf8')), rewrites);
    const merged = mergeManifestValues(
      target,
      source,
      previous?.manifests?.[destRel],
      pkg.packageId,
      rewrites,
      warnings,
      counters,
    );
    const mergedContents = jsonBuffer(merged);
    if (!fs.existsSync(destination) || stableJson(target) !== stableJson(merged)) {
      manifestWrites.push({
        destRel,
        contents: mergedContents,
        kind: 'asset-manifest',
        ownership: 'shared',
      });
    }
    manifestBaselines[destRel] = replaceStrings(source, rewrites);
  }

  incomingRegistry = replaceStrings(incomingRegistry, rewrites);
  const registryBaseline = structuredClone(incomingRegistry);
  files = files.filter((file) => file.kind !== 'asset-manifest').map((file) => {
    if (!isTextBuffer(file.contents)) return file;
    const rewritten = replaceStrings(file.contents.toString('utf8'), rewrites);
    return {...file, contents: Buffer.from(rewritten)};
  });

  const writes = [...manifestWrites];
  const preserved = [];
  for (const file of files) {
    const destination = resolveInside(ROOT, file.destRel, 'file destination');
    if (!fs.existsSync(destination)) {
      writes.push(file);
      counters.copiedFiles += 1;
      continue;
    }
    const local = fs.readFileSync(destination);
    if (sha256(local) === sha256(file.contents)) {
      counters.skippedFiles += 1;
      continue;
    }
    if (file.ownership === 'immutable') {
      throw new Error(`Immutable capability conflict: ${file.destRel}`);
    }
    const previousFile = previous?.files?.[file.destRel];
    if (previousFile) {
      if (!previousFile.preserved && sha256(local) === previousFile.installedHash) {
        writes.push(file);
        counters.updatedFiles += 1;
        continue;
      }
      const basePath = resolveInside(
        BASE_ROOT,
        normalizeRel(path.join(storageKey(pkg.packageId), file.destRel)),
        'merge base',
      );
      const merged = fs.existsSync(basePath)
        ? threeWayMerge(local, fs.readFileSync(basePath), file.contents)
        : null;
      if (merged) {
        writes.push({...file, contents: merged});
        counters.mergedFiles += 1;
        warnings.push(`Merged local changes in ${file.destRel}.`);
        continue;
      }
      if (file.kind === 'reference-doc' || file.kind === 'shared-source') {
        preserved.push(file);
        counters.preservedFiles += 1;
        warnings.push(`Preserved locally modified ${file.kind} ${file.destRel}; incoming copy will be backed up.`);
        continue;
      }
      if (file.kind === 'asset') {
        preserved.push(file);
        counters.preservedFiles += 1;
        warnings.push(`Preserved locally modified asset ${file.destRel}.`);
        continue;
      }
      throw new Error(`Local changes conflict with package update: ${file.destRel}`);
    }
    if (file.kind === 'reference-doc') {
      writes.push(file);
      counters.updatedReferenceDocs += 1;
      warnings.push(`Updated pre-existing reference doc ${file.destRel} with backup.`);
      continue;
    }
    if (file.kind === 'template-spec') {
      writes.push(file);
      counters.updatedTemplateSpecs += 1;
      warnings.push(`Promoted pre-existing documentation to template spec ${file.destRel} with backup.`);
      continue;
    }
    if (file.kind === 'shared-source') {
      preserved.push(file);
      counters.preservedFiles += 1;
      warnings.push(`Preserved project-owned shared source ${file.destRel}; compatibility will be typechecked.`);
      continue;
    }
    throw new Error(`File is owned by the project or another package: ${file.destRel}`);
  }

  const registrySource = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = extractRegistryEntries(registrySource);
  const existing = registry.entries.find((entry) => entry.id === templateId);
  let registryUpdated = registrySource;
  if (existing) {
    const existingValue = parseRegistryEntryText(existing.text);
    if (stableJson(existingValue) === stableJson(incomingRegistry)) {
      counters.skippedRegistry += 1;
    } else if (previous?.templateId === templateId) {
      if (previous.registryEntry) {
        incomingRegistry = mergeOwnedValue(
          existingValue,
          previous.registryEntry,
          incomingRegistry,
          warnings,
          'registry',
        );
      } else {
        if (existingValue.defaultBgMusic !== undefined) {
          incomingRegistry.defaultBgMusic = existingValue.defaultBgMusic;
        }
        if (existingValue.voice !== undefined) incomingRegistry.voice = existingValue.voice;
      }
      const text = registryEntryToText(incomingRegistry);
      registryUpdated = `${registrySource.slice(0, existing.start)}${text}${registrySource.slice(existing.end)}`;
      counters.updatedRegistry += 1;
      warnings.push(`Updated registry metadata for ${templateId}; preserved local voice/music preferences.`);
    } else {
      throw new Error(`Template ID is already owned by the project or another package: ${templateId}`);
    }
  } else {
    const text = registryEntryToText(incomingRegistry);
    const insertText = `\n  ${text.replace(/\n/g, '\n  ')},`;
    registryUpdated = `${registrySource.slice(0, registry.arrayClose)}${insertText}\n${registrySource.slice(registry.arrayClose)}`;
    counters.addedRegistry += 1;
  }
  if (registryUpdated !== registrySource) {
    writes.push({destRel: normalizeRel(path.relative(ROOT, REGISTRY_PATH)), contents: Buffer.from(registryUpdated), kind: 'registry'});
  }

  writes.push(...envUpdates(pkg.env, counters));
  const dependencies = dependencyPlan(pkg);
  return {
    alreadySynced: false,
    stateKey: `${pkg.packageId}@${pkg.version}`,
    templateId,
    packageId: pkg.packageId,
    version: pkg.version,
    writes,
    preserved,
    warnings,
    dependencies,
    incomingFiles: files,
    registryEntry: incomingRegistry,
    registryBaseline,
    manifestBaselines,
    requiresTypecheck: [...writes, ...preserved].some((file) => (
      ['template-source', 'shared-source'].includes(file.kind)
    )),
  };
}

class Transaction {
  constructor() {
    this.originals = new Map();
  }
  capture(target) {
    if (this.originals.has(target)) return;
    this.originals.set(target, fs.existsSync(target) ? fs.readFileSync(target) : null);
  }
  write(target, contents) {
    this.capture(target);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, contents);
  }
  rollback() {
    for (const [target, contents] of [...this.originals.entries()].reverse()) {
      if (contents === null) fs.rmSync(target, {force: true});
      else {
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, contents);
      }
    }
  }
}

function installDependencies(plan, args, counters, transaction) {
  if (plan.dependencies.length === 0) return;
  if (args.skipInstall) {
    console.log(`  dependencies pending: ${plan.dependencies.map(([name]) => name).join(', ')}`);
    return;
  }
  transaction.capture(PACKAGE_JSON_PATH);
  transaction.capture(PACKAGE_LOCK_PATH);
  const installArgs = [
    'install',
    ...plan.dependencies.map(([name, version]) => (
      version && version !== 'latest' ? `${name}@${version}` : name
    )),
  ];
  const result = spawnSync('npm', installArgs, {cwd: ROOT, encoding: 'utf8', stdio: 'pipe'});
  if (result.status !== 0) {
    throw new Error(`npm install failed.\nCommand: npm ${installArgs.join(' ')}\n${result.stderr || result.stdout}`);
  }
  counters.installedDependencies += plan.dependencies.length;
}

function verifyInstalledPlan(plan) {
  for (const write of plan.writes) {
    const target = resolveInside(ROOT, write.destRel, 'verification path');
    if (!fs.existsSync(target)) throw new Error(`Post-sync verification failed; missing ${write.destRel}`);
  }
  const registrySource = fs.readFileSync(REGISTRY_PATH, 'utf8');
  if (!extractRegistryEntries(registrySource).entries.some((entry) => entry.id === plan.templateId)) {
    throw new Error(`Post-sync verification failed; registry is missing ${plan.templateId}`);
  }
  if (plan.registryEntry.specDocPath && !fs.existsSync(path.join(ROOT, plan.registryEntry.specDocPath))) {
    throw new Error(`Post-sync verification failed; spec doc is missing: ${plan.registryEntry.specDocPath}`);
  }
  if (
    plan.registryEntry.assetManifestPath &&
    !fs.existsSync(path.join(ROOT, plan.registryEntry.assetManifestPath))
  ) {
    throw new Error(`Post-sync verification failed; asset manifest is missing: ${plan.registryEntry.assetManifestPath}`);
  }
  const tscPath = path.join(ROOT, 'node_modules/.bin/tsc');
  const tsconfigPath = path.join(ROOT, 'tsconfig.json');
  if (plan.requiresTypecheck && fs.existsSync(tscPath) && fs.existsSync(tsconfigPath)) {
    const result = spawnSync(tscPath, ['--noEmit', '--pretty', 'false'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`Post-sync TypeScript validation failed.\n${result.stdout || result.stderr}`);
    }
  }
}

function applyPlan(plan, pkg, state, args, counters) {
  const transaction = new Transaction();
  const backupRoot = path.join(BACKUP_ROOT, plan.stateKey);
  const nextState = structuredClone(state);
  try {
    for (const write of plan.writes) {
      const target = resolveInside(ROOT, write.destRel, 'write destination');
      if (fs.existsSync(target) && sha256(target) !== sha256(write.contents)) {
        const backup = resolveInside(backupRoot, write.destRel, 'backup path');
        transaction.write(backup, fs.readFileSync(target));
        counters.backedUpFiles += 1;
        if (write.kind === 'reference-doc') counters.backedUpReferenceDocs += 1;
      }
      transaction.write(target, write.contents);
    }

    for (const file of plan.preserved) {
      const incomingRel = normalizeRel(path.join(plan.stateKey, file.destRel));
      const incomingPath = resolveInside(
        path.join(BACKUP_ROOT, 'incoming'),
        incomingRel,
        'incoming conflict copy',
      );
      transaction.write(incomingPath, file.contents);
    }

    installDependencies(plan, args, counters, transaction);
    verifyInstalledPlan(plan);

    const fileState = {};
    for (const file of plan.incomingFiles) {
      const target = resolveInside(ROOT, file.destRel, 'state file path');
      const baseRel = normalizeRel(path.join(storageKey(pkg.packageId), file.destRel));
      const basePath = resolveInside(BASE_ROOT, baseRel, 'base file path');
      transaction.write(basePath, file.contents);
      fileState[file.destRel] = {
        installedHash: fs.existsSync(target) ? sha256(target) : sha256(file.contents),
        packageHash: sha256(file.contents),
        kind: file.kind,
        ownership: file.ownership,
        preserved: plan.preserved.some((entry) => entry.destRel === file.destRel),
      };
    }

    nextState.synced ??= {};
    nextState.packages ??= {};
    nextState.synced[plan.stateKey] = {
      packageId: pkg.packageId,
      version: pkg.version,
      templateId: plan.templateId,
      syncedAt: new Date().toISOString(),
    };
    nextState.packages[pkg.packageId] = {
      installedVersion: pkg.version,
      templateId: plan.templateId,
      syncedAt: new Date().toISOString(),
      dependenciesPending: args.skipInstall && plan.dependencies.length > 0,
      files: fileState,
      manifests: plan.manifestBaselines,
      registryEntry: plan.registryBaseline,
    };
    transaction.write(STATE_PATH, jsonBuffer(nextState));
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, nextState);
    counters.syncedPackages += 1;
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

function listPackages(args) {
  if (!fs.existsSync(LOAD_DIR)) fs.mkdirSync(LOAD_DIR, {recursive: true});
  const dirs = fs.readdirSync(LOAD_DIR, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(LOAD_DIR, entry.name));
  if (!args.package) return dirs;
  return dirs.filter((dir) => path.basename(dir) === args.package);
}

function createCounters() {
  return {
    syncedPackages: 0,
    skippedPackages: 0,
    failedPackages: 0,
    copiedFiles: 0,
    updatedFiles: 0,
    mergedFiles: 0,
    preservedFiles: 0,
    skippedFiles: 0,
    namespacedAssets: 0,
    addedManifestItems: 0,
    skippedManifestItems: 0,
    namespacedManifestItems: 0,
    updatedManifestItems: 0,
    addedRegistry: 0,
    updatedRegistry: 0,
    skippedRegistry: 0,
    addedEnvKeys: 0,
    installedDependencies: 0,
    updatedReferenceDocs: 0,
    updatedTemplateSpecs: 0,
    backedUpReferenceDocs: 0,
    backedUpFiles: 0,
  };
}

function addCounters(target, source) {
  for (const [key, value] of Object.entries(source)) target[key] += value;
}

function printPlan(plan) {
  console.log(`Plan ${plan.stateKey}:`);
  console.log(`  writes: ${plan.writes.length}`);
  console.log(`  preserved local files: ${plan.preserved.length}`);
  console.log(`  dependencies to install: ${plan.dependencies.length}`);
  for (const warning of plan.warnings) console.log(`  warning: ${warning}`);
}

const args = parseArgs(process.argv.slice(2));
const packageDirs = listPackages(args);
if (args.package && packageDirs.length === 0) {
  console.error(`Template package not found in load-templates/: ${args.package}`);
  process.exit(1);
}
if (packageDirs.length === 0) {
  console.log('No template packages found in load-templates/.');
  process.exit(0);
}

const counters = createCounters();
const failures = [];
let state;
try {
  state = readJson(STATE_PATH, {synced: {}, packages: {}});
} catch (error) {
  console.error(`Invalid sync state: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

for (const packageDir of packageDirs) {
  const manifestPath = path.join(packageDir, 'template-package.json');
  if (!fs.existsSync(manifestPath)) {
    console.log(`Skipping ${path.basename(packageDir)}: missing template-package.json`);
    continue;
  }
  try {
    const pkg = readJson(manifestPath);
    const packageCounters = createCounters();
    const plan = buildPlan(packageDir, pkg, state, packageCounters, args);
    if (plan.alreadySynced) {
      counters.skippedPackages += 1;
      console.log(`Already synced: ${plan.stateKey}`);
      continue;
    }
    printPlan(plan);
    if (!args.dryRun) {
      applyPlan(plan, pkg, state, args, packageCounters);
      addCounters(counters, packageCounters);
      console.log(`Synced: ${plan.stateKey}`);
    } else {
      addCounters(counters, packageCounters);
      console.log(`Dry run only: ${plan.stateKey}`);
    }
  } catch (error) {
    counters.failedPackages += 1;
    const message = error instanceof Error ? error.message : String(error);
    failures.push({package: path.basename(packageDir), message});
    console.error(`Failed ${path.basename(packageDir)}: ${message}`);
    if (args.failFast) break;
  }
}

console.log(`packages synced: ${counters.syncedPackages}`);
console.log(`packages skipped: ${counters.skippedPackages}`);
console.log(`packages failed: ${counters.failedPackages}`);
console.log(`files copied: ${counters.copiedFiles}`);
console.log(`files updated: ${counters.updatedFiles}`);
console.log(`files merged: ${counters.mergedFiles}`);
console.log(`local files preserved: ${counters.preservedFiles}`);
console.log(`assets namespaced: ${counters.namespacedAssets}`);
console.log(`manifest items added: ${counters.addedManifestItems}`);
console.log(`manifest items namespaced: ${counters.namespacedManifestItems}`);
console.log(`manifest items updated: ${counters.updatedManifestItems}`);
console.log(`registry entries added: ${counters.addedRegistry}`);
console.log(`registry entries updated: ${counters.updatedRegistry}`);
console.log(`env keys added: ${counters.addedEnvKeys}`);
console.log(`dependencies installed: ${counters.installedDependencies}`);
console.log(`reference docs updated: ${counters.updatedReferenceDocs}`);
console.log(`template specs updated: ${counters.updatedTemplateSpecs}`);
console.log(`reference doc backups: ${counters.backedUpReferenceDocs}`);
console.log(`files backed up: ${counters.backedUpFiles}`);

if (failures.length > 0) process.exitCode = 1;
