#!/usr/bin/env node

/**
 * Automated Multi-Source News Video Generation & YouTube Upload Pipeline
 *
 * Supported Sources:
 *  - Tuổi Trẻ (Thời sự, Tin mới nhất)
 *  - VnExpress (Thời sự, Tin mới nhất)
 *  - Dân Trí (Xã hội, Sự kiện)
 *
 * Usage:
 *   node scripts/auto-news-pipeline.mjs                 # Chạy ngay 1 đợt (3 video, upload công khai)
 *   node scripts/auto-news-pipeline.mjs --dry-run       # Dò tin và hiển thị danh sách bài chọn, không dựng video
 *   node scripts/auto-news-pipeline.mjs --count 3       # Chọn số lượng video cần dựng
 *   node scripts/auto-news-pipeline.mjs --privacy public # Thiết lập chế độ YouTube (public, unlisted, private)
 *   node scripts/auto-news-pipeline.mjs --daemon        # Chạy chế độ ngầm định kỳ 08:00 và 17:30 mỗi ngày
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createProductionManager} from './dashboard-production.mjs';
import {uploadVideo} from './youtube-upload.mjs';
import {buildCandidatePool, createDefaultClient, modelCandidates, parsePubDate, rankArticles} from './rank-news.mjs';
import {sendTelegram} from './notify-telegram.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VIDEOS_DIR = path.join(ROOT, 'videos');
const DEFAULT_DATA_DIR = path.join(ROOT, 'data');
const DEFAULT_HISTORY_FILE = path.join(DEFAULT_DATA_DIR, 'processed-news.json');
const DEFAULT_LOCK_FILE = path.join(DEFAULT_DATA_DIR, 'auto-news.lock');

export const DEFAULT_FEEDS = [
  {
    source: 'Tuổi Trẻ',
    id: 'tuoitre',
    domains: ['tuoitre.vn'],
    urls: [
      'https://tuoitre.vn/rss/thoi-su.rss',
      'https://tuoitre.vn/rss/tin-moi-nhat.rss',
    ],
  },
  {
    source: 'VnExpress',
    id: 'vnexpress',
    domains: ['vnexpress.net'],
    urls: [
      'https://vnexpress.net/rss/thoi-su.rss',
      'https://vnexpress.net/rss/tin-moi-nhat.rss',
    ],
  },
  {
    source: 'Dân Trí',
    id: 'dantri',
    domains: ['dantri.com.vn'],
    urls: [
      // xa-hoi.rss stopped updating in 2025
      'https://dantri.com.vn/rss/thoi-su.rss',
      'https://dantri.com.vn/rss/su-kien.rss',
    ],
  },
];

/**
 * Parse an RSS XML string into an array of normalized items
 */
export function parseRssXml(xmlText, sourceName = '', sourceId = '') {
  const items = [];
  const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemBlock = match[1];
    const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = itemBlock.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const imgMatch = descMatch ? descMatch[1].match(/src=["'](https?:\/\/[^\s"'>]+)/i) : null;
    const enclosureMatch = itemBlock.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)/i);
    const thumbnail = imgMatch ? imgMatch[1] : enclosureMatch ? enclosureMatch[1] : null;

    if (title && link) {
      items.push({
        title,
        link,
        pubDate,
        description: desc,
        thumbnail,
        source: sourceName,
        sourceId,
      });
    }
  }

  return items;
}

export function normalizeUrl(url) {
  try {
    const parsed = new URL(String(url).trim());
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return String(url ?? '').trim();
  }
}

export function isFresh(item, now, maxAgeHours = 12) {
  const published = parsePubDate(item?.pubDate);
  if (Number.isNaN(published)) return false;
  const ageMs = now.getTime() - published;
  return ageMs >= -10 * 60_000 && ageMs <= maxAgeHours * 3_600_000;
}

export function matchesFeedDomain(link, domains) {
  if (!domains?.length) return true;
  try {
    const host = new URL(link).hostname.toLowerCase();
    return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function isHistoryBlocking(entry) {
  if (!entry?.status) return true;
  if (entry.status === 'failed') return (entry.attempts || 0) >= 2;
  return true;
}

export function upsertHistory(historyList, entry) {
  const key = normalizeUrl(entry.url);
  const existing = historyList.find((item) => normalizeUrl(item.url) === key);
  if (existing) return Object.assign(existing, entry, {url: key});
  const created = {...entry, url: key};
  historyList.push(created);
  return created;
}

export function filterCandidates(groupedItems, {feeds, processedUrls, now, maxAgeHours = 12}) {
  const filtered = {};
  for (const [sourceId, items] of Object.entries(groupedItems)) {
    const domains = feeds.find((feed) => feed.id === sourceId)?.domains;
    filtered[sourceId] = items.filter((item) =>
      isFresh(item, now, maxAgeHours) &&
      matchesFeedDomain(item.link, domains) &&
      !processedUrls.has(normalizeUrl(item.link)));
  }
  return filtered;
}

/**
 * Fetch items from a feed configuration
 */
export async function fetchFeedItems(feedConfig, fetcher = fetch) {
  const allItems = [];
  const seenLinks = new Set();

  for (const url of feedConfig.urls) {
    try {
      const response = await fetcher(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      if (!response.ok) continue;
      const xml = await response.text();
      const parsed = parseRssXml(xml, feedConfig.source, feedConfig.id);

      for (const item of parsed) {
        const key = normalizeUrl(item.link);
        if (!seenLinks.has(key)) {
          seenLinks.add(key);
          allItems.push(item);
        }
      }
    } catch {
      // Ignore network errors on fallback feeds
    }
  }

  return allItems;
}

/**
 * Load set of already processed article URLs from history file and videos directory
 */
export function loadProcessedHistory(historyPath = DEFAULT_HISTORY_FILE, videosDir = DEFAULT_VIDEOS_DIR) {
  const processedUrls = new Set();
  const processedSlugs = new Set();
  let historyList = [];

  if (fs.existsSync(historyPath)) {
    let parsed = null;
    try {
      parsed = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch {
      // handled below
    }
    if (Array.isArray(parsed)) {
      historyList = parsed;
    } else {
      // Keep the bad file for manual recovery instead of overwriting it on the next save.
      const quarantine = `${historyPath}.corrupt-${Date.now()}`;
      fs.renameSync(historyPath, quarantine);
      console.error(`⚠️ Lịch sử hỏng, đã chuyển sang ${quarantine}`);
    }
  }
  const knownUrls = new Set();
  for (const item of historyList) {
    if (!item?.url) continue;
    knownUrls.add(normalizeUrl(item.url));
    if (isHistoryBlocking(item)) processedUrls.add(normalizeUrl(item.url));
    if (item.slug) processedSlugs.add(item.slug);
  }

  // Also scan videos/ directory for context.txt
  if (fs.existsSync(videosDir)) {
    try {
      const entries = fs.readdirSync(videosDir, {withFileTypes: true});
      for (const entry of entries) {
        if (entry.isDirectory()) {
          processedSlugs.add(entry.name);
          const contextFile = path.join(videosDir, entry.name, 'context.txt');
          if (fs.existsSync(contextFile)) {
            const content = fs.readFileSync(contextFile, 'utf8').trim();
            const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/);
            // History decides for URLs it knows (e.g. a once-failed article stays retryable).
            if (urlMatch && !knownUrls.has(normalizeUrl(urlMatch[0]))) {
              processedUrls.add(normalizeUrl(urlMatch[0]));
            }
          }
        }
      }
    } catch {
      // Ignore directory scan errors
    }
  }

  return {processedUrls, processedSlugs, historyList};
}

/**
 * Save updated history records
 */
export function saveProcessedHistory(historyPath = DEFAULT_HISTORY_FILE, historyList = []) {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
  const tempPath = `${historyPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(historyList, null, 2), 'utf8');
  fs.renameSync(tempPath, historyPath);
}

/**
 * Select articles for a balanced batch (1 from Tuổi Trẻ, 1 from VnExpress, 1 from Dân Trí)
 */
export function selectArticlesForBatch(groupedItems, processedUrls, count = 3) {
  const selected = [];
  const chosenUrls = new Set(processedUrls);

  // Group by sourceId
  const sources = Object.keys(groupedItems);
  if (sources.length === 0) return selected;

  let pointer = 0;
  let roundsWithoutAdd = 0;

  while (selected.length < count && roundsWithoutAdd < sources.length) {
    const sourceKey = sources[pointer % sources.length];
    const pool = groupedItems[sourceKey] || [];
    const candidate = pool.find((item) => !chosenUrls.has(normalizeUrl(item.link)));

    if (candidate) {
      selected.push(candidate);
      chosenUrls.add(normalizeUrl(candidate.link));
      roundsWithoutAdd = 0;
    } else {
      roundsWithoutAdd += 1;
    }

    pointer += 1;
  }

  return selected;
}

export function defaultIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

export function acquireLock(lockPath, {now = new Date(), isAlive = defaultIsAlive, maxAgeMs = 3 * 3_600_000} = {}) {
  if (fs.existsSync(lockPath)) {
    let lock = null;
    try {
      lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    } catch {
      // Corrupt lock: treat as stale
    }
    const startedAt = Date.parse(lock?.startedAt);
    if (lock && isAlive(lock.pid) && now.getTime() - startedAt <= maxAgeMs) {
      const since = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit'}).format(new Date(startedAt));
      return {ok: false, reason: `Đợt trước (PID ${lock.pid}) vẫn đang chạy từ ${since}`};
    }
  }
  fs.mkdirSync(path.dirname(lockPath), {recursive: true});
  fs.writeFileSync(lockPath, JSON.stringify({pid: process.pid, startedAt: now.toISOString()}), 'utf8');
  return {ok: true};
}

export function releaseLock(lockPath) {
  try {
    fs.rmSync(lockPath, {force: true});
  } catch {
    // Nothing to release
  }
}

export async function checkOpenAiProxy({
  client,
  model = process.env.OPENAI_MODEL,
  models = modelCandidates(model),
  attempts = 3,
  delayMs = 300_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onLog = console.log,
} = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let lastError = null;
    for (const candidateModel of models) {
      try {
        const openai = client || await createDefaultClient({timeout: 30_000, maxRetries: 0});
        await openai.responses.create({model: candidateModel, input: 'ping', max_output_tokens: 16});
        return true;
      } catch (error) {
        lastError = error;
      }
    }
    onLog(`🔌 Proxy OpenAI lỗi với mọi model (lần ${attempt}/${attempts}): ${lastError?.message}`);
    if (attempt < attempts) await sleep(delayMs);
  }
  return false;
}

export function isQuotaError(error) {
  return Boolean(error?.errors?.some?.((item) => item.reason === 'quotaExceeded')) ||
    /quota/i.test(String(error?.message || ''));
}

/**
 * Wait for a production job to reach a final status
 */
export async function waitForProductionJob(productionManager, jobId, pollIntervalMs = 2000, maxWaitMs = 600000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const job = productionManager.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found.`);
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Job ${jobId} timed out after ${Math.round(maxWaitMs / 1000)}s.`);
}

export const MAX_RENDER_ATTEMPTS = 2;
export const MAX_UPLOAD_ATTEMPTS = 3;
const TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function formatSlotLabel(date) {
  const time = new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false}).format(date);
  const day = new Intl.DateTimeFormat('en-GB', {timeZone: TIME_ZONE, day: '2-digit', month: '2-digit'}).format(date);
  return `${time} ${day}`;
}

export function formatBatchSummary({slotLabel, processed, failed, backlogPending, notes = []}) {
  const total = processed.length + failed.length;
  const lines = [];
  if (total === 0) {
    lines.push(`📭 Đợt ${slotLabel} — không có tin mới phù hợp`);
  } else {
    lines.push(`${processed.length > 0 ? '✅' : '❌'} Đợt ${slotLabel} — ${processed.length}/${total} video`);
  }
  processed.forEach((item, index) => {
    const airTime = item.publishAt ? ` (lên sóng ${formatSlotLabel(new Date(item.publishAt))})` : '';
    lines.push(`${index + 1}. [${item.source}] ${item.title} → ${item.youtubeUrl || '(chờ upload)'}${airTime}`);
    if (item.reason) lines.push(`   Lý do: ${item.reason}`);
  });
  for (const item of failed) {
    lines.push(`❌ [${item.source}] ${item.title} — ${String(item.error ?? '').slice(0, 120)}`);
  }
  if (backlogPending > 0) lines.push(`⏭ Backlog: ${backlogPending} video chờ upload lại`);
  lines.push(...notes);
  return lines.join('\n');
}

async function renderWithRetry(manager, article, jobTimeoutMs, onLog) {
  const job = await manager.createJob({context: article.link, templateId: 'news/media-showcase', audioMode: 'full'});
  onLog(`   ID Job: ${job.id} | Slug: ${job.slug}`);
  onLog(`   Đang chạy pipeline Remotion (Setup -> Acquire -> Audio -> Spec -> Render)...`);
  let finished;
  try {
    finished = await waitForProductionJob(manager, job.id, 2000, jobTimeoutMs);
    if (finished.status !== 'completed') {
      onLog(`   ⚠️ Lần 1 thất bại: ${finished.error || finished.message}. Thử lại 1 lần...`);
      await manager.retryJob(job.id);
      finished = await waitForProductionJob(manager, job.id, 2000, jobTimeoutMs);
    }
  } catch (error) {
    // Timed-out jobs are still active, so they cannot be retried; stop them instead.
    await manager.cancelJob?.(job.id);
    throw error;
  }
  if (finished.status !== 'completed') {
    throw new Error(finished.error || finished.message || 'Lỗi không xác định khi dựng video');
  }
  return finished;
}

/**
 * Run one automated batch: lock → proxy check → upload backlog → pick news → render → upload → notify
 */
export async function runAutoNewsBatch(options = {}) {
  const {
    rootDir = ROOT,
    feeds = DEFAULT_FEEDS,
    count = 3,
    privacy = process.env.YOUTUBE_PRIVACY_STATUS || 'public',
    dryRun = false,
    historyFile = DEFAULT_HISTORY_FILE,
    videosDir = DEFAULT_VIDEOS_DIR,
    productionManager = null,
    uploader = uploadVideo,
    onLog = console.log,
    now = () => new Date(),
    lockFile = DEFAULT_LOCK_FILE,
    preflight = () => checkOpenAiProxy({onLog}),
    ranker = rankArticles,
    notify = sendTelegram,
    jobTimeoutMs = 20 * 60_000,
    maxAgeHours = 12,
  } = options;

  const startedAt = now();
  const slotLabel = formatSlotLabel(startedAt);
  const safeNotify = async (text) => {
    try {
      return await notify(text);
    } catch (error) {
      onLog(`⚠️ Gửi thông báo thất bại: ${error.message}`);
      return false;
    }
  };

  onLog(`\n======================================================`);
  onLog(`🚀 BẮT ĐẦU ĐỢT QUÉT TIN TỨC VÀ SẢN XUẤT VIDEO`);
  onLog(`⏰ Thời gian: ${startedAt.toLocaleString('vi-VN', {timeZone: TIME_ZONE})}`);
  onLog(`🎯 Số lượng mục tiêu: ${count} video`);
  onLog(`📺 Chế độ YouTube: ${privacy.toUpperCase()}`);
  onLog(`======================================================\n`);

  if (!dryRun) {
    const lock = acquireLock(lockFile, {now: startedAt});
    if (!lock.ok) {
      onLog(`⏳ ${lock.reason}. Bỏ qua đợt này.`);
      await safeNotify(`⏳ ${lock.reason}. Bỏ qua đợt ${slotLabel}.`);
      return {processed: [], failed: [], total: 0, backlog: {uploaded: 0, pending: 0}, aborted: 'locked'};
    }
  }

  try {
    if (!dryRun && !(await preflight())) {
      const message = `🔌 Proxy OpenAI không phản hồi sau 3 lần thử, bỏ qua đợt ${slotLabel}. Lịch sử bài viết không thay đổi.`;
      onLog(message);
      await safeNotify(message);
      return {processed: [], failed: [], total: 0, backlog: {uploaded: 0, pending: 0}, aborted: 'proxy'};
    }

    const {processedUrls, historyList} = loadProcessedHistory(historyFile, videosDir);
    onLog(`📚 Đã ghi nhận ${processedUrls.size} bài viết trong lịch sử chống trùng.`);

    const processed = [];
    const failed = [];
    const notes = [];
    let quotaHit = false;
    let backlogUploaded = 0;
    const save = () => saveProcessedHistory(historyFile, historyList);
    const uploadOptions = {videosDir, privacy, log: (msg) => onLog(`      [YouTube] ${msg}`)};

    // 1. Upload backlog
    if (!dryRun) {
      for (const entry of historyList.filter((item) => item.status === 'rendered')) {
        if (quotaHit) break;
        onLog(`📤 Upload lại từ backlog: ${entry.title} (${entry.slug})`);
        try {
          const result = await uploader(entry.slug, uploadOptions);
          Object.assign(entry, {status: 'completed', youtubeUrl: result.url, videoId: result.videoId, publishAt: result.publishAt, processedAt: startedAt.toISOString()});
          processed.push({...entry, reason: entry.reason || 'upload lại từ backlog'});
          backlogUploaded += 1;
        } catch (error) {
          if (isQuotaError(error)) {
            quotaHit = true;
            onLog(`   ⚠️ Hết quota YouTube: ${error.message}`);
            break;
          }
          entry.uploadAttempts = (entry.uploadAttempts || 0) + 1;
          entry.lastError = error.message;
          onLog(`   ⚠️ Upload lỗi (${entry.uploadAttempts}/${MAX_UPLOAD_ATTEMPTS}): ${error.message}`);
          if (entry.uploadAttempts >= MAX_UPLOAD_ATTEMPTS) {
            Object.assign(entry, {status: 'failed', attempts: MAX_RENDER_ATTEMPTS});
            failed.push({
              title: entry.title,
              url: entry.url,
              source: entry.source,
              error: `upload lỗi 3 lần — video ở videos/${entry.slug}/output/video.mp4, upload tay nếu cần`,
            });
          }
        }
        save();
      }
    }

    // 2. Scan RSS, filter, rank
    const groupedItems = {};
    for (const feed of feeds) {
      onLog(`🔍 Đang quét RSS nguồn: ${feed.source}...`);
      groupedItems[feed.id] = await fetchFeedItems(feed);
    }
    const filtered = filterCandidates(groupedItems, {feeds, processedUrls, now: startedAt, maxAgeHours});
    for (const feed of feeds) {
      onLog(`   -> ${feed.source}: ${groupedItems[feed.id].length} bài, còn ${filtered[feed.id].length} bài mới hợp lệ.`);
    }

    const pool = buildCandidatePool(filtered);
    const dayAgo = startedAt.getTime() - 24 * 3_600_000;
    const recentTitles = historyList
      .filter((item) => item.status === 'completed' && Date.parse(item.processedAt) >= dayAgo && item.title)
      .map((item) => item.title);
    const chosenArticles = await ranker(pool, {count, recentTitles, now: startedAt, onLog});
    if (chosenArticles.length < count) {
      const chosenUrls = new Set([...processedUrls, ...chosenArticles.map((item) => normalizeUrl(item.link))]);
      const remaining = {};
      for (const item of pool) (remaining[item.sourceId] ||= []).push(item);
      const extra = selectArticlesForBatch(remaining, chosenUrls, count - chosenArticles.length);
      chosenArticles.push(...extra.map((item) => ({...item, reason: 'fallback luân phiên'})));
    }

    if (chosenArticles.length === 0 && processed.length === 0 && failed.length === 0) {
      onLog(`⚠️ Không tìm thấy bài viết mới nào phù hợp.`);
      if (!dryRun) await safeNotify(formatBatchSummary({slotLabel, processed, failed, backlogPending: 0, notes}));
      return {processed, failed, total: 0, backlog: {uploaded: 0, pending: 0}, aborted: 'no-news'};
    }

    onLog(`\n📋 Danh sách ${chosenArticles.length} bài viết được chọn cho đợt này:`);
    chosenArticles.forEach((article, index) => {
      onLog(`  ${index + 1}. [${article.source}] ${article.title}`);
      onLog(`     URL: ${article.link}`);
      onLog(`     Lý do: ${article.reason}`);
    });

    if (dryRun) {
      onLog(`\n[DRY RUN] Đã hoàn tất dò tin và chọn bài. Bỏ qua bước dựng video và upload.`);
      return {processed: chosenArticles, failed: [], total: chosenArticles.length, dryRun: true};
    }

    // 3. Render + upload
    const manager = productionManager || createProductionManager({rootDir, maxConcurrent: 1});
    for (let i = 0; i < chosenArticles.length; i += 1) {
      const article = chosenArticles[i];
      onLog(`\n------------------------------------------------------`);
      onLog(`🎬 [${i + 1}/${chosenArticles.length}] [${article.source}] ${article.title}`);
      onLog(`   Link: ${article.link}`);

      const base = {title: article.title, url: article.link, source: article.source, reason: article.reason};
      let job;
      try {
        job = await renderWithRetry(manager, article, jobTimeoutMs, onLog);
      } catch (error) {
        onLog(`   ❌ Thất bại: ${error.message}`);
        const previous = historyList.find((item) => normalizeUrl(item.url) === normalizeUrl(article.link));
        upsertHistory(historyList, {
          ...base,
          status: 'failed',
          attempts: (previous?.attempts || 0) + 1,
          lastError: error.message,
          processedAt: startedAt.toISOString(),
        });
        failed.push({...base, error: error.message});
        save();
        continue;
      }

      onLog(`   ✅ Video đã render: videos/${job.slug}/output/video.mp4`);
      const entry = upsertHistory(historyList, {
        ...base,
        slug: job.slug,
        status: 'rendered',
        uploadAttempts: 0,
        lastError: null,
        processedAt: startedAt.toISOString(),
      });
      save();

      if (!quotaHit) {
        onLog(`   📤 Đang tải video lên YouTube (Chế độ: ${privacy})...`);
        try {
          const result = await uploader(job.slug, uploadOptions);
          Object.assign(entry, {status: 'completed', youtubeUrl: result.url, videoId: result.videoId, publishAt: result.publishAt});
          onLog(`   🎉 Upload thành công: ${result.url}`);
        } catch (error) {
          if (isQuotaError(error)) {
            quotaHit = true;
            onLog(`   ⚠️ Hết quota YouTube: ${error.message}`);
          } else {
            entry.uploadAttempts = 1;
            entry.lastError = error.message;
            onLog(`   ⚠️ Lỗi upload YouTube: ${error.message}`);
          }
        }
        save();
      }
      processed.push({...entry});
    }

    if (quotaHit) notes.push('Hết quota YouTube — video chờ upload ở đợt sau');
    const pending = historyList.filter((item) => item.status === 'rendered').length;
    onLog(`\n🏁 HOÀN TẤT ĐỢT: ${processed.length}/${processed.length + failed.length} video. Backlog: ${pending}.`);
    await safeNotify(formatBatchSummary({slotLabel, processed, failed, backlogPending: pending, notes}));
    return {processed, failed, total: chosenArticles.length, backlog: {uploaded: backlogUploaded, pending}};
  } finally {
    if (!dryRun) releaseLock(lockFile);
  }
}

/**
 * Start the background daemon that triggers at 08:00 and 17:30 daily (Asia/Ho_Chi_Minh)
 */
export function startSchedulerDaemon(options = {}) {
  const {
    targetTimes = ['08:00', '17:30'],
    checkIntervalMs = 30000,
    timeZone = 'Asia/Ho_Chi_Minh',
    onLog = console.log,
  } = options;

  onLog(`\n🕒 ĐÃ KÍCH HOẠT CHẾ ĐỘ DAEMON TỰ ĐỘNG`);
  onLog(`⏰ Các khung giờ kích hoạt hàng ngày: ${targetTimes.join(' và ')} (Múi giờ: ${timeZone})`);
  onLog(`🔄 Đang giám sát thời gian hệ thống...\n`);

  const triggeredToday = new Set();

  const check = async () => {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
    const timeStr = new Intl.DateTimeFormat('en-GB', {timeZone, hour: '2-digit', minute: '2-digit', hour12: false}).format(now);

    for (const target of targetTimes) {
      const key = `${dateStr}-${target}`;
      if (timeStr === target && !triggeredToday.has(key)) {
        triggeredToday.add(key);
        onLog(`\n🔔 ĐÃ ĐẾN KHUNG GIỜ HẸN: ${target} ngày ${dateStr}. Tự động kích hoạt đợt sản xuất!`);
        try {
          await runAutoNewsBatch(options);
        } catch (err) {
          onLog(`❌ Lỗi khi chạy đợt tự động: ${err.message}`);
        }
      }
    }

    // Clean up old date keys
    for (const key of triggeredToday) {
      if (!key.startsWith(dateStr)) triggeredToday.delete(key);
    }
  };

  const timer = setInterval(check, checkIntervalMs);
  check();
  return timer;
}

// CLI Execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isDaemon = args.includes('--daemon');

  let count = 3;
  const countIdx = args.indexOf('--count');
  if (countIdx !== -1 && args[countIdx + 1]) {
    count = parseInt(args[countIdx + 1], 10) || 3;
  }

  let privacy = process.env.YOUTUBE_PRIVACY_STATUS || 'public';
  const privacyIdx = args.indexOf('--privacy');
  if (privacyIdx !== -1 && args[privacyIdx + 1]) {
    privacy = args[privacyIdx + 1];
  }

  if (isDaemon) {
    startSchedulerDaemon({count, privacy});
  } else {
    runAutoNewsBatch({count, privacy, dryRun}).then(() => process.exit(0), (err) => {
      console.error('\n❌ Lỗi thực thi:', err.message || err);
      process.exit(1);
    });
  }
}
