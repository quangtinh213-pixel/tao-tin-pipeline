import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Rules come from VN News Analytics (10/2026): hooks with these patterns kept
// ~30-37% average view percentage versus ~50% for the rest. See SCRIPT_RULES.md §2.
export const DEFAULT_HOOK_MAX_WORDS = 22;
// ~3.75 spoken words/second on this channel: 140 words keeps news near the 35s cap.
export const DEFAULT_SCRIPT_MAX_WORDS = 140;

export const OUTCOME_REVEAL_PATTERNS = [
  /may mắn/u,
  /kịp thời/u,
  /không (?:có )?(?:ai )?(?:bị )?thương vong/u,
  /không (?:gây )?(?:có )?thiệt hại/u,
  /thoát nạn/u,
  /(?:đã|được) cứu sống/u,
  /đã được cứu/u,
  /(?:giải cứu|cứu) thành công/u,
  /(?:đã|đều|được) an toàn/u,
  /bình an vô sự|bình yên vô sự/u,
];

const WEAK_OPENER_PATTERN =
  /^(?:vào ngày|ngày \d|mới đây|gần đây|theo |công an |bộ |ubnd |ủy ban |uỷ ban |sở |cơ quan |chính phủ |thủ tướng )/u;

function normalize(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export function countHookWords(text) {
  const clean = normalize(text);
  return clean ? clean.split(' ').length : 0;
}

export function validateHook(text, {maxWords = DEFAULT_HOOK_MAX_WORDS} = {}) {
  const hook = normalize(text);
  const lower = hook.toLocaleLowerCase('vi');
  const wordCount = countHookWords(hook);
  const errors = [];

  if (!hook) {
    return {valid: false, wordCount, errors: ['Hook trống.']};
  }
  if (wordCount > maxWords) {
    errors.push(`Hook dài ${wordCount} từ, tối đa ${maxWords}. Chuyển bối cảnh/cơ quan/thời gian sang segment 1.`);
  }
  const reveal = OUTCOME_REVEAL_PATTERNS.map((pattern) => lower.match(pattern)).find(Boolean);
  if (reveal) {
    errors.push(`Hook lộ kết cục ("${reveal[0]}"). Giữ kết quả cho segment cuối hoặc ending.`);
  }
  // A colon after a word in the first 6 words is a hype label ("Cảnh báo y tế khẩn: ..."), not a time like 5:30.
  if (/\p{L}:\s/u.test(hook.split(' ').slice(0, 6).join(' '))) {
    errors.push('Hook mở bằng nhãn "X:". Bỏ nhãn, nói thẳng sự việc.');
  }
  if (WEAK_OPENER_PATTERN.test(lower)) {
    errors.push('Hook mở bằng ngày/"Mới đây"/"Theo"/tên cơ quan. Đưa chủ thể và hành động lên đầu.');
  }

  return {valid: errors.length === 0, wordCount, errors};
}

export function validateScript(segments, {maxScriptWords = DEFAULT_SCRIPT_MAX_WORDS, ...hookOptions} = {}) {
  const texts = (Array.isArray(segments) ? segments : []).map((segment) => segment?.text);
  const hook = validateHook(texts[0], hookOptions);
  const totalWords = texts.reduce((sum, text) => sum + countHookWords(text), 0);
  const errors = [...hook.errors];
  if (totalWords > maxScriptWords) {
    errors.push(`Kịch bản dài ${totalWords} từ, tối đa ${maxScriptWords} (~${Math.round(maxScriptWords / 4)} giây). Cắt dữ kiện yếu nhất.`);
  }
  return {valid: errors.length === 0, hookWords: hook.wordCount, totalWords, errors};
}

export async function validateScriptFile(scriptPath, options) {
  const payload = JSON.parse(await readFile(scriptPath, 'utf8'));
  return validateScript(payload?.script, options);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const [, , scriptPath, ...extra] = process.argv;
  // Long-form templates raise the word cap: --max-words=2200 (hook rule stays the same).
  const maxFlag = extra.length === 1 ? extra[0].match(/^--max-words=(\d+)$/) : null;
  if (!scriptPath || (extra.length > 0 && !maxFlag)) {
    console.error('Dùng: node scripts/script-rules.mjs <videos/<slug>/script/script.json> [--max-words=<n>]');
    process.exitCode = 1;
  } else {
    try {
      const result = await validateScriptFile(scriptPath, maxFlag ? {maxScriptWords: Number(maxFlag[1])} : undefined);
      if (result.valid) {
        console.log(`Kịch bản hợp lệ (hook ${result.hookWords} từ, tổng ${result.totalWords} từ).`);
      } else {
        for (const error of result.errors) console.error(error);
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Không thể kiểm tra kịch bản: ${error.message || error}`);
      process.exitCode = 1;
    }
  }
}
