#!/usr/bin/env node

// A/B test "hook-card" for news/media-showcase: checks spec.hookCard against the article
// text, then stamps its arm. Half of the slugs show the card, half are controls, so
// yt-report can compare retention between videos that were all eligible for a card.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {OUTCOME_REVEAL_PATTERNS} from './script-rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HOOK_CARD_MAX_VALUE = 12;
export const HOOK_CARD_MAX_LABEL = 48;

const normalize = (value) => String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('vi');

export function hookCardArm(slug) {
  let hash = 7;
  for (const char of slug) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return hash % 2 ? 'card' : 'control';
}

export function validateHookCard(card, sourceText) {
  const errors = [];
  const value = String(card?.value ?? '').trim();
  const label = String(card?.label ?? '').trim();
  const quote = normalize(card?.sourceQuote);

  if (!value) errors.push('hookCard.value trống.');
  if (value.length > HOOK_CARD_MAX_VALUE) errors.push(`hookCard.value dài ${value.length} ký tự, tối đa ${HOOK_CARD_MAX_VALUE}.`);
  if (!label) errors.push('hookCard.label trống.');
  if (label.length > HOOK_CARD_MAX_LABEL) errors.push(`hookCard.label dài ${label.length} ký tự, tối đa ${HOOK_CARD_MAX_LABEL}.`);
  if (!quote || !normalize(sourceText).includes(quote)) {
    errors.push('hookCard.sourceQuote không có nguyên văn trong source-context.txt.');
  } else {
    const missing = (value.match(/\d+/gu) ?? []).filter((digits) => !quote.includes(digits));
    if (missing.length) errors.push(`Số ${missing.join(', ')} trên thẻ không có trong sourceQuote.`);
  }
  const reveal = OUTCOME_REVEAL_PATTERNS.map((pattern) => normalize(`${value} ${label}`).match(pattern)).find(Boolean);
  if (reveal) errors.push(`Thẻ lộ kết cục ("${reveal[0]}").`);
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Dùng: node scripts/hook-card.mjs <slug>');
    process.exit(1);
  }
  const specPath = path.join(ROOT, 'videos', slug, 'spec.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  if (!spec.hookCard) {
    console.log('Không có hookCard: video không tham gia A/B hook-card.');
    process.exit(0);
  }
  const errors = validateHookCard(spec.hookCard, fs.readFileSync(path.join(ROOT, 'videos', slug, 'source-context.txt'), 'utf8'));
  if (errors.length) {
    for (const error of errors) console.error(`❌ ${error}`);
    process.exit(1);
  }
  spec.hookCard.arm = hookCardArm(slug);
  fs.writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`hookCard hợp lệ · nhóm ${spec.hookCard.arm === 'card' ? 'B (hiện thẻ)' : 'A (đối chứng, không hiện thẻ)'}.`);
}
