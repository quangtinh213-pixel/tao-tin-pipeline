import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateCaption} from './caption-rules.mjs';

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function validateCaptionFiles(captionPath, specPath, scriptPath) {
  const [caption, spec, scriptPayload] = await Promise.all([
    readFile(captionPath, 'utf8'),
    readJson(specPath),
    readJson(scriptPath),
  ]);
  const scriptSegments = Array.isArray(scriptPayload?.script)
    ? scriptPayload.script
      .map((segment) => (typeof segment?.text === 'string' ? segment.text.trim() : ''))
      .filter(Boolean)
    : [];

  return validateCaption(caption, {
    title: spec?.video?.title,
    hook: scriptSegments[0],
    scriptText: scriptSegments.join(' '),
    publisher: spec?.source?.publisher,
  });
}

function usage() {
  return 'Dùng: node scripts/validate-caption.mjs <captionPath> <specPath> <scriptPath>';
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const [, , captionPath, specPath, scriptPath, ...extra] = process.argv;
  if (!captionPath || !specPath || !scriptPath || extra.length > 0) {
    console.error(usage());
    process.exitCode = 1;
  } else {
    try {
      const result = await validateCaptionFiles(captionPath, specPath, scriptPath);
      if (result.valid) {
        console.log(`Caption hợp lệ (${result.wordCount} từ).`);
      } else {
        for (const error of result.errors) console.error(error);
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Không thể kiểm tra caption: ${error.message || error}`);
      process.exitCode = 1;
    }
  }
}
