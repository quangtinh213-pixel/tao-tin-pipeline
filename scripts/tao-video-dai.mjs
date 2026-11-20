#!/usr/bin/env node

/**
 * Runner cho pipeline tạo video dài 16:9 tự động.
 * Kết nối hàng đợi tin tức (long-queue.json) với engine HyperFrames (pipeline/tttc.chay_dai).
 *
 * Cách dùng:
 *   node scripts/tao-video-dai.mjs                    # Lấy tin điểm cao nhất trong hàng đợi và chạy tự động
 *   node scripts/tao-video-dai.mjs <slug>             # Chạy video cụ thể theo slug
 *   node scripts/tao-video-dai.mjs --review           # Chạy có điểm duyệt thủ công (duyet-1.html, duyet-2.html)
 *   node scripts/tao-video-dai.mjs <slug> --step kiem # Chạy riêng 1 bước (kiem, giong, canh, render, dong-goi, dang)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildQueue} from './long-news-filter.mjs';
import {sendTelegram, sendTelegramPhoto} from './notify-telegram.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PIPELINE_DIR = path.resolve(ROOT, '..', 'pipeline');
const DATA_DIR = path.join(ROOT, 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'long-queue.json');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 50)
    .replace(/^-+|-+$/g, '');
}

async function resolveTargetSlug(targetArg) {
  if (targetArg && !targetArg.startsWith('--')) {
    return targetArg;
  }

  // Đọc từ hàng đợi long-queue.json
  let queue = [];
  if (fs.existsSync(QUEUE_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
      queue = Array.isArray(parsed) ? parsed : (parsed?.picks || []);
    } catch {
      queue = [];
    }
  }

  if (!queue.length) {
    console.log('🔍 Hàng đợi trống, đang quét tin tức nóng đạt chuẩn...');
    const res = await buildQueue({count: 2, log: console.log});
    queue = res?.picks || [];
  }

  if (!queue.length) {
    throw new Error('Không có tin tức nào đạt chuẩn chất lượng cho video dài (cần điểm >= 45, >= 2 nguồn báo).');
  }

  const pick = queue[0];
  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = `${dateStr}-${slugify(pick.title)}`;
  const videoDir = path.join(ROOT, 'videos', slug);

  // Tạo cấu trúc ban đầu nếu chưa có
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, {recursive: true});
    fs.mkdirSync(path.join(videoDir, 'nguon'), {recursive: true});
    fs.mkdirSync(path.join(videoDir, 'anh'), {recursive: true});
    fs.mkdirSync(path.join(videoDir, 'broll'), {recursive: true});

    const chuDeContent = `# ${pick.title}\n\n- Chủ đề: ${pick.category}\n- Điểm chất lượng: ${pick.score}/100\n- Nguồn:\n${(pick.sources || []).map((s) => `  * ${s.url} (${s.outlet})`).join('\n')}\n`;
    fs.writeFileSync(path.join(videoDir, 'chu-de.md'), chuDeContent, 'utf8');
  }

  return slug;
}

async function main() {
  const args = process.argv.slice(2);
  const reviewMode = args.includes('--review');
  const stepArgIndex = args.indexOf('--step');
  const step = stepArgIndex !== -1 ? args[stepArgIndex + 1] : null;
  const targetArg = args.find((a) => !a.startsWith('--') && a !== step);

  let slug;
  try {
    slug = await resolveTargetSlug(targetArg);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 KHỞI CHẠY PIPELINE TẠO VIDEO DÀI 16:9 CHO: ${slug}`);
  console.log(`   Engine: HyperFrames (pipeline/tttc)`);
  console.log(`   Chế độ: ${reviewMode ? 'Duyệt thủ công (--review)' : 'Tự động (--auto)'}`);
  if (step) console.log(`   Bước riêng: ${step}`);
  console.log(`======================================================\n`);

  const pyArgs = ['run', 'python', '-m', 'tttc.chay_dai', slug];
  if (reviewMode) pyArgs.push('--review');
  if (step) pyArgs.push('--step', step);

  const env = {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  };

  const uvCmd = process.platform === 'win32' ? 'uv.exe' : 'uv';
  const child = spawn(uvCmd, pyArgs, {
    cwd: PIPELINE_DIR,
    env,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    console.error(`❌ Không chạy được uv trong ${PIPELINE_DIR}: ${err.message}`);
    process.exit(1);
  });

  child.on('close', async (code) => {
    if (code === 0) {
      console.log(`\n✅ Hoàn thành quy trình tạo video dài thành công (${slug}).`);
      const vDir = path.join(ROOT, 'videos', slug);
      const thumbPath = path.join(vDir, 'output', 'thumbnail.jpg');
      const moTaPath = path.join(vDir, 'output', 'mo-ta.txt');
      let title = slug;
      if (fs.existsSync(moTaPath)) {
        title = fs.readFileSync(moTaPath, 'utf8').split('\n')[0] || slug;
      }
      const msg = `🎬 [VN News] Video dài 16:9 đã sẵn sàng!\n📌 Tiêu đề: ${title}\n📁 Thư mục: videos/${slug}\n📺 Trạng thái: Render hoàn tất & Đã lên lịch phát sóng`;
      try {
        if (fs.existsSync(thumbPath)) {
          await sendTelegramPhoto(thumbPath, msg);
        } else {
          await sendTelegram(msg);
        }
      } catch (e) {
        console.warn(`⚠️ Gửi thông báo Telegram thất bại: ${e.message}`);
      }
    } else {
      console.error(`\n❌ Pipeline kết thúc với mã lỗi: ${code}`);
      try {
        await sendTelegram(`❌ [VN News] Tạo video dài thất bại cho slug: ${slug} (mã lỗi ${code})`);
      } catch {}
    }
    process.exit(code);
  });
}

main();
