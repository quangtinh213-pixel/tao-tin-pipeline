#!/usr/bin/env node

/**
 * Master Daily Production Orchestrator
 *
 * Coordinates daily video generation & YouTube scheduled uploads:
 * Target: 8 Shorts (gap >= 90m) + max 1 Long Video (16:9) per day (3-4/week).
 *
 * Daily Schedule (Asia/Ho_Chi_Minh - UTC+7):
 *  - Shift 1 (06:30): 2 Shorts
 *  - Shift 2 (09:30): up to 1 Long (Air: 12:00 / 15:30) + 2 Shorts
 *  -- 14:00 - 15:00: Google resets YouTube API quota (10,000 units) --
 *  - Shift 3 (15:30): up to 1 Long (if none produced today) + 2 Shorts
 *  - Shift 4 (18:30): 2 Shorts
 *  - Report  (23:00): Daily Performance & Next 24h Schedule check via Telegram
 *
 * Usage:
 *   node scripts/daily-orchestrator.mjs --daemon        # Chạy nền tự động theo đồng hồ
 *   node scripts/daily-orchestrator.mjs --batch 1       # Chạy thủ công Ca 1
 *   node scripts/daily-orchestrator.mjs --batch 2       # Chạy thủ công Ca 2
 *   node scripts/daily-orchestrator.mjs --batch 3       # Chạy thủ công Ca 3
 *   node scripts/daily-orchestrator.mjs --batch 4       # Chạy thủ công Ca 4
 *   node scripts/daily-orchestrator.mjs --report        # Chạy báo cáo ngày
 *   node scripts/daily-orchestrator.mjs --status        # Xem tình trạng các ca hôm nay
 *   node scripts/daily-orchestrator.mjs --dry-run       # Dò tin và xếp lịch, không render
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  acquireLock,
  releaseLock,
  runAutoNewsBatch,
} from './auto-news-pipeline.mjs';
import {buildQueue} from './long-news-filter.mjs';
import {checkAgyPreflight, runAgyTaoTin, runAgyTaoVideoDai} from './agy-runner.mjs';
import {sendTelegram} from './notify-telegram.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const LOCK_FILE = path.join(DATA_DIR, 'auto-news.lock');
const STATE_FILE = path.join(DATA_DIR, 'daily-orchestrator-state.json');
const TAO_TIN_RUN_FILE = path.join(DATA_DIR, 'tao-tin-run.json');
const LOG_FILE = path.join(DATA_DIR, 'daily-orchestrator-latest.log');

export const DAILY_SHIFTS = {
  '1': {id: '1', time: '06:30', nextTime: '09:30', name: 'Ca 1 (Sáng sớm)', shorts: 2, long: 0},
  '2': {id: '2', time: '09:30', nextTime: '15:30', name: 'Ca 2 (Sáng)', shorts: 2, long: 1},
  '3': {id: '3', time: '15:30', nextTime: '18:30', name: 'Ca 3 (Chiều)', shorts: 2, long: 1},
  '4': {id: '4', time: '18:30', nextTime: '06:30', name: 'Ca 4 (Tối)', shorts: 2, long: 0},
  'report': {id: 'report', time: '23:00', name: 'Báo cáo ngày', shorts: 0, long: 0, isReport: true},
};

export function isAgyQuotaOrUnavailableError(err) {
  const msg = String(err?.message ?? err ?? '');
  return /RESOURCE_EXHAUSTED|code 429|\b429\b|quota reached|agy thoát với mã 3|agy CLI chưa sẵn sàng/i.test(msg);
}

export function shouldProduceLongToday({now = new Date(), topScore = 0, alreadyProducedToday = false} = {}) {
  if (alreadyProducedToday) return false;
  const vnDay = Number(new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit'}).format(now));
  const minScore = vnDay % 2 === 0 ? 45 : 55;
  return Number(topScore) >= minScore;
}

function runDirectLongScript({rootDir = ROOT, onLog = console.log} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(rootDir, 'scripts', 'tao-video-dai.mjs')], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    child.stdout?.on('data', (c) => {
      for (const line of c.toString('utf8').split(/\r?\n/)) {
        if (line.trim()) onLog(`   [long] ${line}`);
      }
    });
    child.stderr?.on('data', (c) => {
      stderr += c.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({status: 'fallback-completed'});
      else reject(new Error(`tao-video-dai.mjs thoát với mã ${code}: ${stderr.slice(0, 300)}`));
    });
  });
}

export function loadOrchestratorState(file = STATE_FILE) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // fallback to fresh
  }
  return {records: {}};
}

export function saveOrchestratorState(state, file = STATE_FILE) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Produce 1 Long Video using `agy` (/tao-video-dai) — no external LLM API calls.
 */
export async function produceLongVideo({
  dryRun = false,
  onLog = console.log,
  agyRunner,
  longFallbackRunner = runDirectLongScript,
  now = new Date(),
  alreadyProducedToday = false,
  agyAvailable = true,
} = {}) {
  onLog(`\n======================================================`);
  onLog(`📺 BẮT ĐẦU SẢN XUẤT VIDEO DÀI 16:9 (HyperFrames / pipeline/tttc)`);
  onLog(`======================================================`);

  const queueResult = await buildQueue({count: 2, log: onLog});
  const picks = queueResult?.picks || [];
  if (!picks.length) {
    onLog(`⚠️ Không có tin tức nào đạt chuẩn chất lượng cho video dài.`);
    return {status: 'skipped', reason: 'no-qualified-news'};
  }

  const pick = picks[0];
  if (!shouldProduceLongToday({now, topScore: pick.score, alreadyProducedToday})) {
    onLog(`⏭️ Bỏ qua video dài ca này (đã làm hôm nay=${alreadyProducedToday}, điểm=${pick.score}).`);
    return {status: 'skipped', reason: alreadyProducedToday ? 'already-produced-today' : 'below-odd-day-threshold'};
  }

  onLog(`\n🎯 Đã chọn chủ đề điểm cao nhất [${pick.score}/100]:`);
  onLog(`   Tiêu đề: ${pick.title}`);
  onLog(`   Chủ đề: ${pick.category} · Số nguồn báo: ${pick.outlets.length}`);
  onLog(`   Khung hẹn giờ dự kiến: ${pick.publishSlot || '12:00 / 15:30'}`);

  if (dryRun) {
    onLog(`\n[DRY RUN] Bỏ qua bước dựng và upload video dài.`);
    return {status: 'dry-run', pick};
  }

  if (!agyAvailable) {
    onLog(`🔄 agy không khả dụng -> chuyển thẳng sang pipeline/tttc (Direct Gemini API)...`);
    await sendTelegram(`🔄 [API FALLBACK - VIDEO DÀI]\nagy không khả dụng, đang chạy trực tiếp pipeline/tttc cho: ${pick.title}`);
    await longFallbackRunner({rootDir: ROOT, onLog});
    return {status: 'fallback-completed', title: pick.title};
  }

  try {
    await runAgyTaoVideoDai({
      count: 1,
      rootDir: ROOT,
      onLog,
      ...(agyRunner && {runner: agyRunner}),
    });
    onLog(`   ✅ Hoàn tất agy /tao-video-dai.`);
    return {status: 'completed', title: pick.title};
  } catch (err) {
    if (isAgyQuotaOrUnavailableError(err)) {
      onLog(`🔄 agy hết quota/lỗi (${err.message}) -> fallback sang pipeline/tttc (Direct Gemini API)...`);
      await sendTelegram(`🔄 [API FALLBACK - VIDEO DÀI]\nagy lỗi quota (${err.message.slice(0, 120)}), đã chuyển sang Direct Gemini API cho: ${pick.title}`);
      await longFallbackRunner({rootDir: ROOT, onLog});
      return {status: 'fallback-completed', title: pick.title};
    }
    onLog(`   ❌ Thất bại khi tạo video dài bằng agy: ${err.message}`);
    await sendTelegram(`❌ [LỖI VIDEO DÀI - AGY]\nTiêu đề: ${pick.title}\nLỗi: ${err.message}`);
    return {status: 'failed', error: err.message};
  }
}

function countRunCompleted(runFile = TAO_TIN_RUN_FILE) {
  try {
    if (!fs.existsSync(runFile)) return 0;
    const run = JSON.parse(fs.readFileSync(runFile, 'utf8'));
    return (run.articles || []).filter((a) => a.status === 'completed' || a.status === 'rendered').length;
  } catch {
    return 0;
  }
}

/**
 * Execute a specific shift
 */
export async function runShift(shiftKey, {
  dryRun = false,
  onLog = console.log,
  agyRunner,
  shortFallbackRunner = ({count, onLog: l}) => runAutoNewsBatch({count, lockFile: null, onLog: l}),
  longFallbackRunner = runDirectLongScript,
  lockFile = LOCK_FILE,
  stateFile = STATE_FILE,
} = {}) {
  const shift = DAILY_SHIFTS[shiftKey];
  if (!shift) throw new Error(`Ca không hợp lệ: "${shiftKey}". Chọn 1, 2, 3, 4 hoặc report.`);

  const logLines = [];
  const log = (msg = '') => {
    logLines.push(String(msg));
    onLog(msg);
  };

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Ho_Chi_Minh'}).format(now);
  log(`\n######################################################`);
  log(`🌟 KÍCH HOẠT: ${shift.name} - Ngày ${dateStr} (Chế độ: agy + API fallback)`);
  log(`📋 Kế hoạch: ${shift.long} Video Dài + ${shift.shorts} Video Shorts`);
  log(`######################################################\n`);

  if (shift.isReport) {
    log(`📊 Đang tạo báo cáo hiệu quả kênh hàng ngày...`);
    try {
      const {buildReport, buildSummary} = await import('./yt-report.mjs');
      const report = await buildReport();
      const summaryText = buildSummary(report);
      log(summaryText);
      await sendTelegram(summaryText);

      if (stateFile) {
        const state = loadOrchestratorState(stateFile);
        const dayRecords = (state.records[dateStr] ||= {});
        dayRecords[shiftKey] = {
          finishedAt: new Date().toISOString(),
          mode: 'agy',
          long: 0,
          shorts: 0,
        };
        saveOrchestratorState(state, stateFile);
      }

      return {shift: shiftKey, status: 'reported'};
    } catch (e) {
      log(`⚠️ Báo cáo thất bại: ${e.message}`);
      return {shift: shiftKey, status: 'report-failed', error: e.message};
    }
  }

  // Acquire mutex lock
  if (lockFile && !dryRun) {
    const lock = acquireLock(lockFile, {now});
    if (!lock.ok) {
      log(`⏳ Tiến trình khác đang chạy (${lock.reason}). Bỏ qua ca ${shiftKey}.`);
      return {shift: shiftKey, status: 'locked'};
    }
  }

  const results = {shift: shiftKey, long: null, shorts: null};
  let modeUsed = 'agy';
  try {
    let agyAvailable = true;
    if (!dryRun && !agyRunner) {
      agyAvailable = await checkAgyPreflight({onLog: log});
      if (!agyAvailable) {
        modeUsed = 'api-fallback';
        log(`🔄 agy CLI chưa sẵn sàng -> chuyển sang chế độ Direct API fallback.`);
      }
    }

    const stateBefore = stateFile ? loadOrchestratorState(stateFile) : {records: {}};
    const todayRecs = Object.values(stateBefore.records?.[dateStr] || {});
    const alreadyProducedToday = todayRecs.some((r) => r?.long === 'completed' || r?.long === 'fallback-completed');

    // 1. Dựng Video Dài trước (nếu ca có video dài)
    if (shift.long > 0) {
      results.long = await produceLongVideo({
        dryRun,
        onLog: log,
        agyRunner,
        longFallbackRunner,
        now,
        alreadyProducedToday,
        agyAvailable,
      });
    }

    // 2. Dựng Video Shorts kế tiếp
    if (shift.shorts > 0) {
      log(`\n======================================================`);
      log(`📱 BẮT ĐẦU SẢN XUẤT ${shift.shorts} VIDEO SHORTS`);
      log(`======================================================`);
      if (dryRun) {
        results.shorts = await runAutoNewsBatch({
          count: shift.shorts,
          dryRun: true,
          lockFile: null,
          onLog: log,
        });
      } else if (!agyAvailable) {
        modeUsed = 'api-fallback';
        const fb = await shortFallbackRunner({count: shift.shorts, onLog: log});
        results.shorts = {status: 'fallback-completed', count: fb?.processed?.length ?? 0};
      } else {
        try {
          await runAgyTaoTin({
            count: shift.shorts,
            until: shift.nextTime || null,
            rootDir: ROOT,
            onLog: log,
            ...(agyRunner && {runner: agyRunner}),
          });
          results.shorts = {status: 'completed', count: countRunCompleted()};
        } catch (err) {
          if (isAgyQuotaOrUnavailableError(err)) {
            modeUsed = 'api-fallback';
            log(`🔄 agy hết quota/lỗi (${err.message}) -> fallback sang Direct API (auto-news-pipeline)...`);
            await sendTelegram(`🔄 [API FALLBACK - SHORTS]\n${shift.name}: agy hết quota, chuyển sang Direct Gemini API.`);
            const fb = await shortFallbackRunner({count: shift.shorts, onLog: log});
            results.shorts = {status: 'fallback-completed', count: fb?.processed?.length ?? 0};
          } else {
            log(`❌ agy /tao-tin thất bại: ${err.message}`);
            await sendTelegram(`❌ [LỖI SHORTS - AGY]\n${shift.name}: ${err.message}`);
            results.shorts = {status: 'failed', error: err.message, count: countRunCompleted()};
          }
        }
      }
    }

    // Update state record
    if (stateFile) {
      const state = loadOrchestratorState(stateFile);
      const dayRecords = (state.records[dateStr] ||= {});
      dayRecords[shiftKey] = {
        finishedAt: new Date().toISOString(),
        mode: modeUsed,
        long: results.long?.status,
        shorts: results.shorts?.processed?.length ?? results.shorts?.count ?? 0,
      };
      saveOrchestratorState(state, stateFile);
    }

    return results;
  } finally {
    try {
      fs.mkdirSync(path.dirname(LOG_FILE), {recursive: true});
      fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n', 'utf8');
    } catch {
      // ignore log write errors
    }
    if (lockFile && !dryRun) releaseLock(lockFile);
  }
}

/**
 * Background daemon checking clock every 30 seconds
 */
export function startDailyDaemon(options = {}) {
  const {timeZone = 'Asia/Ho_Chi_Minh', onLog = console.log} = options;
  onLog(`\n🕒 ĐÃ KHỞI ĐỘNG MASTER ORCHESTRATOR DAEMON`);
  onLog(`⏰ Lịch trình tự động 10 Shorts + 2 Video Dài:`);
  Object.values(DAILY_SHIFTS).forEach((s) => {
    onLog(`   • ${s.time} -> ${s.name} (${s.long ? `${s.long} Dài, ` : ''}${s.shorts ? `${s.shorts} Shorts` : 'Báo cáo'})`);
  });
  onLog(`🔄 Đang giám sát đồng hồ hệ thống (${timeZone})...\n`);

  const triggeredToday = new Set();
  const check = async () => {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {timeZone}).format(now);
    const timeStr = new Intl.DateTimeFormat('en-GB', {timeZone, hour: '2-digit', minute: '2-digit', hour12: false}).format(now);

    for (const [key, shift] of Object.entries(DAILY_SHIFTS)) {
      const triggerKey = `${dateStr}-${shift.time}-${key}`;
      if (timeStr === shift.time && !triggeredToday.has(triggerKey)) {
        triggeredToday.add(triggerKey);
        onLog(`\n🔔 [${timeStr}] ĐẾN GIỜ: ${shift.name}. Tự động kích hoạt!`);
        try {
          await runShift(key, options);
        } catch (err) {
          onLog(`❌ Lỗi khi thực thi ${shift.name}: ${err.message}`);
        }
      }
    }
  };

  const timer = setInterval(check, 30_000);
  check();
  return () => clearInterval(timer);
}

/**
 * Auto-detect and run current shift based on clock
 */
export async function runAutoShift({dryRun = false, onLog = console.log} = {}) {
  const now = new Date();
  const timeZone = 'Asia/Ho_Chi_Minh';
  const hour = Number(new Intl.DateTimeFormat('en-GB', {timeZone, hour: '2-digit', hour12: false}).format(now));
  const minute = Number(new Intl.DateTimeFormat('en-GB', {timeZone, minute: '2-digit'}).format(now));
  const totalMinutes = hour * 60 + minute;

  let target = '1';
  if (totalMinutes >= 330 && totalMinutes <= 510) target = '1';
  else if (totalMinutes > 510 && totalMinutes <= 780) target = '2';
  else if (totalMinutes >= 870 && totalMinutes <= 1050) target = '3';
  else if (totalMinutes > 1050 && totalMinutes <= 1320) target = '4';
  else if (totalMinutes > 1320 || totalMinutes < 180) target = 'report';
  else target = totalMinutes < 870 ? '2' : '3';

  onLog(`⏰ [Tự động nhận diện ca] Thời gian hiện tại: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} -> Kích hoạt ${DAILY_SHIFTS[target]?.name}`);
  return runShift(target, {dryRun, onLog});
}

/**
 * Display daily status
 */
export function printTodayStatus() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Ho_Chi_Minh'}).format(now);
  const state = loadOrchestratorState();
  const today = state.records[dateStr] || {};

  console.log(`\n📊 TÌNH TRẠNG SẢN XUẤT HÔM NAY (${dateStr}):`);
  console.log(`------------------------------------------------------`);
  Object.values(DAILY_SHIFTS).forEach((shift) => {
    const rec = today[shift.id];
    const statusText = rec ? `✅ Đã xong lúc ${rec.finishedAt.slice(11, 16)} (Dài: ${rec.long || 0}, Shorts: ${rec.shorts || 0})` : `⏳ Chưa chạy (Khung hẹn: ${shift.time})`;
    console.log(`[${shift.time}] ${shift.name.padEnd(20)} -> ${statusText}`);
  });
  console.log(`------------------------------------------------------\n`);
}

// CLI Execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isDaemon = args.includes('--daemon');
  const isStatus = args.includes('--status');
  const isReport = args.includes('--report');
  const isAuto = args.includes('--auto');

  let batchArg = null;
  const batchIdx = args.indexOf('--batch');
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    batchArg = args[batchIdx + 1];
  }

  if (isStatus) {
    printTodayStatus();
    process.exit(0);
  }

  if (isDaemon) {
    startDailyDaemon({dryRun});
  } else if (isAuto) {
    runAutoShift({dryRun}).then(() => process.exit(0), (err) => {
      console.error('❌ Lỗi:', err);
      process.exit(1);
    });
  } else if (isReport) {
    runShift('report', {dryRun}).then(() => process.exit(0), (err) => {
      console.error('❌ Lỗi:', err);
      process.exit(1);
    });
  } else if (batchArg) {
    runShift(batchArg, {dryRun}).then(() => process.exit(0), (err) => {
      console.error('❌ Lỗi:', err);
      process.exit(1);
    });
  } else {
    console.log(`Dùng:
  node scripts/daily-orchestrator.mjs --batch <1|2|3|4>   # Chạy thủ công từng ca
  node scripts/daily-orchestrator.mjs --daemon            # Chạy nền liên tục theo lịch
  node scripts/daily-orchestrator.mjs --report            # Báo cáo kênh
  node scripts/daily-orchestrator.mjs --status            # Xem tình trạng các ca hôm nay
  node scripts/daily-orchestrator.mjs --dry-run           # Thử nghiệm không render/upload`);
    process.exit(0);
  }
}
