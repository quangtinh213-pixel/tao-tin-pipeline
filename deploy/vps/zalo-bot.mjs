#!/usr/bin/env node
// Bot Zalo giao việc cho agy trên VPS. Chỉ nhận lệnh từ ZALO_OWNER_ID.
// Cấu hình trong .env: ZALO_BOT_TOKEN, ZALO_OWNER_ID (để trống lúc đầu để lấy ID).
import 'dotenv/config';
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TOKEN = (process.env.ZALO_BOT_TOKEN || '').trim();
const OWNER = (process.env.ZALO_OWNER_ID || '').trim();
const API = `https://bot-api.zaloplatforms.com/bot${TOKEN}`;
const RUNNER = path.join(ROOT, 'deploy/vps/run-tao-tin.sh');
const LOCK = path.join(ROOT, 'data/vps-tao-tin.lock');
const LOGS = path.join(ROOT, 'logs');
const BUSY = 75;

if (!TOKEN) {
  console.error('Thiếu ZALO_BOT_TOKEN trong .env');
  process.exit(1);
}

const HELP = `Lệnh:
• tạo tin [số] — chạy /tao-tin (mặc định 5 bài)
• tạo video dài [số] — chạy /tao-video-dai
• dán link bài báo — dựng video từ bài đó và hẹn giờ đăng YouTube
• trạng thái — việc đang chạy + log mới nhất
• dừng — huỷ việc đang chạy
• câu bất kỳ — hỏi agy (vd: hôm nay đã đăng mấy video?)`;

const AUTO = 'Đọc AGENTS.md trước.';
let job = null; // {name, child, started, log}
const seen = new Set();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, body = {}) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(70_000),
  });
  return res.json();
}

async function send(chatId, text) {
  const s = String(text || '').trim() || '(trống)';
  for (let i = 0; i < s.length; i += 1900) {
    try {
      const r = await call('sendMessage', {chat_id: chatId, text: s.slice(i, i + 1900)});
      if (!r.ok) console.error('sendMessage lỗi:', r.error_code, r.description);
    } catch (e) {
      console.error('sendMessage lỗi:', e.message);
    }
  }
}

function tail(file, n = 1500) {
  try {
    const s = fs.readFileSync(file, 'utf8');
    return s.length > n ? '…' + s.slice(-n) : s;
  } catch {
    return '';
  }
}

function latestLog() {
  try {
    const files = fs.readdirSync(LOGS).filter((f) => f.endsWith('.log') && f !== 'skipped.log')
      .map((f) => ({f, t: fs.statSync(path.join(LOGS, f)).mtimeMs}))
      .sort((a, b) => b.t - a.t);
    return files[0] ? path.join(LOGS, files[0].f) : null;
  } catch {
    return null;
  }
}

function lockHeldByOther() {
  const r = spawnSync('flock', ['-n', LOCK, 'true']);
  return r.status !== 0;
}

const mins = (ms) => Math.round(ms / 60000);

function start(chatId, name, {count = '', prompt} = {}) {
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const log = path.join(LOGS, `bot-${stamp}.log`);
  const env = {...process.env, LOG_FILE: log};
  if (prompt) env.AGY_PROMPT = prompt;
  else delete env.AGY_PROMPT;
  const child = spawn('bash', [RUNNER, count].filter(Boolean), {cwd: ROOT, env, detached: true, stdio: 'ignore'});
  job = {name, child, started: Date.now(), log};
  send(chatId, `▶️ Bắt đầu: ${name}`);
  child.on('exit', (code, signal) => {
    const took = mins(Date.now() - job.started);
    job = null;
    if (code === BUSY) return send(chatId, '⏳ Đang có lượt chạy theo lịch, thử lại sau. Gõ "trạng thái" để xem.');
    const head = signal ? `⛔ Đã dừng: ${name}` : code === 0 ? `✅ Xong: ${name} (${took} phút)` : `⚠️ Lỗi: ${name} (exit ${code}, ${took} phút)`;
    send(chatId, `${head}\n\n${tail(log)}`);
  });
}

function status() {
  if (job) return `🔄 Đang chạy: ${job.name} (${mins(Date.now() - job.started)} phút)\n\n${tail(job.log, 1200)}`;
  if (lockHeldByOther()) {
    const log = latestLog();
    return `🔄 Đang chạy lượt theo lịch.\n\n${log ? tail(log, 1200) : ''}`;
  }
  const log = latestLog();
  return `💤 Không có việc nào đang chạy.${log ? `\n\nLog gần nhất (${path.basename(log)}):\n${tail(log, 800)}` : ''}`;
}

async function handle(msg) {
  const chatId = msg.chat?.id;
  const from = msg.from?.id;
  const text = (msg.text || '').trim();
  if (!chatId) return;

  if (!OWNER) {
    console.log(`[ghép đôi] from=${from} name=${msg.from?.display_name}`);
    return send(chatId, `Bot chưa có chủ. ID Zalo của bạn: ${from}`);
  }
  if (String(from) !== OWNER) return; // bỏ qua người lạ
  if (!text) return send(chatId, 'Bot chỉ nhận tin nhắn chữ.');

  const lower = text.toLowerCase();
  if (/^\/?(help|trợ giúp|lệnh|\?)$/.test(lower)) return send(chatId, HELP);
  if (/^\/?(trạng thái|status)$/.test(lower)) return send(chatId, status());
  if (/^\/?(dừng|stop|huỷ|hủy)$/.test(lower)) {
    if (!job) return send(chatId, lockHeldByOther() ? 'Lượt theo lịch đang chạy, bot không dừng được lượt đó.' : 'Không có việc nào đang chạy.');
    try { process.kill(-job.child.pid, 'SIGTERM'); } catch {}
    return;
  }
  if (job) return send(chatId, `Đang bận: ${job.name} (${mins(Date.now() - job.started)} phút). Gõ "trạng thái" hoặc "dừng".`);

  let m = lower.match(/^\/?(?:tạo tin|tao tin|tao-tin)\s*(\d+)?$/);
  if (m) return start(chatId, `tạo tin ${m[1] || 5}`, {count: m[1] || ''});

  m = lower.match(/^\/?(?:tạo video dài|tao video dai|tao-video-dai)\s*(\d+)?$/);
  if (m) {
    return start(chatId, `tạo video dài ${m[1] || ''}`.trim(), {
      prompt: `${AUTO} Đọc docs/SKILL-TAO-VIDEO-DAI.md rồi chạy /tao-video-dai ${m[1] || ''} đến hết.`,
    });
  }

  const url = text.match(/https?:\/\/\S+/)?.[0];
  if (url) {
    return start(chatId, `video từ link ${url}`, {
      prompt: `${AUTO} Chủ kênh gửi link bài báo: ${url}. Thêm yêu cầu kèm theo (nếu có): ${text.replace(url, '').trim() || 'không'}. Dựng video theo đúng quy tắc "chỉ gửi một link bài báo" trong AGENTS.md, rồi upload bằng node scripts/youtube-upload.mjs "<slug>" (hẹn giờ, không dùng --now). Cuối cùng trả lời ngắn: tiêu đề, link YouTube, giờ lên sóng.`,
    });
  }

  return start(chatId, `câu hỏi: ${text.slice(0, 60)}`, {
    prompt: `${AUTO} Chủ kênh nhắn qua Zalo: "${text}". Thực hiện hoặc trả lời yêu cầu đó trong phạm vi dự án này. Câu trả lời cuối bằng tiếng Việt, văn bản thuần, dưới 1500 ký tự.`,
  });
}

async function main() {
  await call('deleteWebhook').catch(() => {});
  const me = await call('getMe').catch((e) => ({ok: false, description: e.message}));
  console.log(me.ok ? `Bot chạy: ${me.result?.display_name || me.result?.account_name || ''}` : `getMe lỗi: ${me.description}`);
  for (;;) {
    try {
      const r = await call('getUpdates', {timeout: '30'});
      if (r.ok && r.result) {
        for (const u of [].concat(r.result)) {
          const msg = u.message;
          if (!msg || seen.has(msg.message_id)) continue;
          seen.add(msg.message_id);
          if (seen.size > 500) seen.delete(seen.values().next().value);
          await handle(msg).catch((e) => console.error('xử lý lỗi:', e.message));
        }
      } else if (!r.ok) {
        await sleep(1000);
      }
    } catch (e) {
      if (e.name !== 'TimeoutError') console.error('getUpdates lỗi:', e.message);
      await sleep(2000);
    }
  }
}

main();
