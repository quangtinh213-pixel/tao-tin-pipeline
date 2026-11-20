#!/usr/bin/env node

/**
 * Generate high-CTR YouTube thumbnail for long-form / explainer videos.
 *
 * Usage:
 *   node scripts/generate-thumbnail.mjs <slug>
 *   node scripts/generate-thumbnail.mjs --slug <slug>
 *   node scripts/generate-thumbnail.mjs --latest
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VIDEOS_DIR = path.join(ROOT, 'videos');

export function findLatestVideo(dir = DEFAULT_VIDEOS_DIR) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs
    .readdirSync(dir, {withFileTypes: true})
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => {
      const fullPath = path.join(dir, e.name);
      const stat = fs.statSync(fullPath);
      return {name: e.name, mtimeMs: stat.mtimeMs};
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return entries.length > 0 ? entries[0].name : null;
}

/**
 * Render YouTube thumbnail (1280x720) using Remotion Still
 */
export async function renderThumbnail(slug, options = {}) {
  const {
    rootDir = ROOT,
    output,
    imageFormat = 'jpeg',
    jpegQuality = 90,
    log = console.log,
  } = options;

  if (!slug) {
    throw new Error('Vui lòng cung cấp slug của video để tạo thumbnail.');
  }

  const slugDir = path.join(rootDir, 'videos', slug);
  const outPath = output || path.join(slugDir, 'output', `thumbnail.${imageFormat === 'png' ? 'png' : 'jpg'}`);

  fs.mkdirSync(path.dirname(outPath), {recursive: true});

  log(`\n🖼️  BẮT ĐẦU TẠO THUMBNAIL (1280x720) CHO VIDEO: ${slug}`);
  log(`   📁 Đường dẫn file: ${path.relative(rootDir, outPath)}`);

  const propsPath = path.join(slugDir, 'props.json');
  fs.writeFileSync(propsPath, JSON.stringify({slug}), 'utf8');

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    'remotion',
    'still',
    'src/Root.tsx',
    'Thumbnail',
    outPath,
    '--image-format',
    imageFormat,
    '--jpeg-quality',
    String(jpegQuality),
    `--props=${propsPath}`,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(npxCmd, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        const stats = fs.statSync(outPath);
        const sizeKb = (stats.size / 1024).toFixed(1);
        log(`   ✅ Render thumbnail thành công! Kích thước: ${sizeKb} KB (Chuẩn YouTube < 2048 KB)`);
        resolve({outPath, sizeBytes: stats.size, slug});
      } else {
        const errMessage = stderr || stdout || `Process exited with code ${code}`;
        reject(new Error(`Thất bại khi render thumbnail: ${errMessage}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// CLI execution
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectCli) {
  const args = process.argv.slice(2);
  const isLatest = args.includes('--latest');

  let targetSlug = args.find((arg) => !arg.startsWith('--'));
  const slugIndex = args.indexOf('--slug');
  if (slugIndex !== -1 && args[slugIndex + 1]) {
    targetSlug = args[slugIndex + 1];
  }

  if (isLatest || !targetSlug) {
    targetSlug = findLatestVideo(DEFAULT_VIDEOS_DIR);
    if (!targetSlug) {
      console.error('❌ Không tìm thấy video nào trong thư mục videos/.');
      process.exit(1);
    }
  }

  (async () => {
    try {
      await renderThumbnail(targetSlug);
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Lỗi:', err.message || err);
      process.exit(1);
    }
  })();
}
