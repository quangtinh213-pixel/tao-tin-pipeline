#!/usr/bin/env node

/**
 * Helper for the agent-driven "tạo tin" command (docs/SKILL-TAO-TIN.md).
 * The coding agent picks the articles and runs /gen-video itself; this script only
 * fetches candidates, tracks the run so it can resume, writes history and reports.
 *
 * Usage:
 *   node scripts/tao-tin.mjs candidates
 *   node scripts/tao-tin.mjs select '[{"index":3,"reason":"..."}]' [--force]
 *   node scripts/tao-tin.mjs next
 *   node scripts/tao-tin.mjs record --url <url> --status completed|rendered|failed [--slug <slug>] [--error <text>]
 *   node scripts/tao-tin.mjs finish
 *   node scripts/tao-tin.mjs free-slots --until HH:MM
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  DEFAULT_FEEDS,
  fetchFeedItems,
  filterCandidates,
  formatBatchSummary,
  formatSlotLabel,
  loadProcessedHistory,
  normalizeUrl,
  saveProcessedHistory,
  upsertHistory,
} from './auto-news-pipeline.mjs';
import {buildCandidatePool, parsePubDate, validatePicks} from './rank-news.mjs';
import {sendTelegram} from './notify-telegram.mjs';
import {DEFAULT_PUBLISH_GAP_MINUTES, DEFAULT_PUBLISH_SLOTS, nextPublishSlot, takenPublishTimes} from './youtube-upload.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const DEFAULTS = {
  historyFile: path.join(DATA_DIR, 'processed-news.json'),
  videosDir: path.join(ROOT, 'videos'),
  candidatesFile: path.join(DATA_DIR, 'tao-tin-candidates.json'),
  runFile: path.join(DATA_DIR, 'tao-tin-run.json'),
};
const STATUSES = ['completed', 'rendered', 'failed'];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(`${file}.tmp`, file);
};

export async function getCandidates({
  feeds = DEFAULT_FEEDS,
  historyFile = DEFAULTS.historyFile,
  videosDir = DEFAULTS.videosDir,
  candidatesFile = DEFAULTS.candidatesFile,
  now = new Date(),
  fetcher = fetch,
} = {}) {
  const {processedUrls, historyList} = loadProcessedHistory(historyFile, videosDir);
  const grouped = {};
  for (const feed of feeds) grouped[feed.id] = await fetchFeedItems(feed, fetcher);
  const pool = buildCandidatePool(filterCandidates(grouped, {feeds, processedUrls, now}));
  writeJson(candidatesFile, pool);

  const dayAgo = now.getTime() - 24 * 3_600_000;
  return {
    candidates: pool.map((item, index) => ({
      index,
      source: item.source,
      sourceId: item.sourceId,
      title: item.title,
      link: item.link,
      description: String(item.description ?? '').slice(0, 200),
      ageHours: Math.round(((now.getTime() - parsePubDate(item.pubDate)) / 3_600_000) * 10) / 10,
      hasImage: Boolean(item.thumbnail),
    })),
    recentTitles: historyList
      .filter((item) => item.status === 'completed' && Date.parse(item.processedAt) >= dayAgo && item.title)
      .map((item) => item.title),
  };
}

export function selectArticles(picks, {
  candidatesFile = DEFAULTS.candidatesFile,
  runFile = DEFAULTS.runFile,
  now = new Date(),
  force = false,
} = {}) {
  if (!fs.existsSync(candidatesFile)) throw new Error('Chưa có danh sách candidates — chạy `tao-tin.mjs candidates` trước.');
  if (!force && fs.existsSync(runFile)) {
    const previous = readJson(runFile);
    const pending = previous.articles.filter((article) => article.status === 'pending').length;
    if (!previous.finishedAt && pending > 0) {
      throw new Error(`Lượt trước còn ${pending} bài chưa xong — chạy \`next\` để làm tiếp, hoặc \`select … --force\` để bỏ.`);
    }
  }
  const articles = validatePicks(picks, readJson(candidatesFile), {count: picks.length});
  if (articles.length === 0) throw new Error('Không có bài hợp lệ trong danh sách chọn.');
  const run = {startedAt: now.toISOString(), articles: articles.map((article) => ({...article, status: 'pending'}))};
  writeJson(runFile, run);
  return run;
}

export function nextArticle({runFile = DEFAULTS.runFile} = {}) {
  if (!fs.existsSync(runFile)) return null;
  const {articles} = readJson(runFile);
  const index = articles.findIndex((article) => article.status === 'pending');
  return index === -1 ? null : {...articles[index], position: index + 1, total: articles.length};
}

export function recordResult({
  url,
  status,
  slug = null,
  error = null,
  runFile = DEFAULTS.runFile,
  historyFile = DEFAULTS.historyFile,
  videosDir = DEFAULTS.videosDir,
  now = new Date(),
}) {
  if (!STATUSES.includes(status)) throw new Error(`status phải là một trong: ${STATUSES.join(', ')}`);
  const run = readJson(runFile);
  const article = run.articles.find((item) => normalizeUrl(item.link) === normalizeUrl(url));
  if (!article) throw new Error(`URL không có trong lượt hiện tại: ${url}`);

  let upload = {};
  if (status === 'completed') {
    const metaPath = path.join(videosDir, String(slug), 'youtube.json');
    if (!slug || !fs.existsSync(metaPath)) {
      throw new Error(`Không thấy ${metaPath} — chưa upload xong thì ghi status rendered.`);
    }
    const meta = readJson(metaPath);
    upload = {youtubeUrl: meta.url, videoId: meta.videoId, ...(meta.publishAt && {publishAt: meta.publishAt})};
  }

  const {historyList} = loadProcessedHistory(historyFile, videosDir);
  const previous = historyList.find((item) => normalizeUrl(item.url) === normalizeUrl(url));
  const entry = {
    title: article.title,
    url: article.link,
    source: article.source,
    reason: article.reason,
    status,
    processedAt: now.toISOString(),
    lastError: error,
    ...(slug && {slug}),
    ...upload,
  };
  if (status === 'failed') entry.attempts = (previous?.attempts || 0) + 1;
  if (status === 'rendered') entry.uploadAttempts = (previous?.uploadAttempts || 0) + 1;
  upsertHistory(historyList, entry);
  saveProcessedHistory(historyFile, historyList);

  Object.assign(article, {status, slug, error}, upload);
  writeJson(runFile, run);
  return article;
}

export async function finishRun({
  runFile = DEFAULTS.runFile,
  historyFile = DEFAULTS.historyFile,
  videosDir = DEFAULTS.videosDir,
  notify = sendTelegram,
} = {}) {
  const run = readJson(runFile);
  const processed = run.articles.filter((article) => article.status === 'completed' || article.status === 'rendered');
  const failed = run.articles
    .filter((article) => article.status === 'failed' || article.status === 'pending')
    .map((article) => ({...article, error: article.status === 'pending' ? 'chưa được xử lý (lượt bị dừng giữa chừng)' : article.error}));
  const {historyList} = loadProcessedHistory(historyFile, videosDir);
  const text = formatBatchSummary({
    slotLabel: formatSlotLabel(new Date(run.startedAt)),
    processed,
    failed,
    backlogPending: historyList.filter((item) => item.status === 'rendered').length,
    notes: [],
  });
  try {
    await notify(text);
  } catch (error) {
    console.error(`⚠️ Gửi Telegram thất bại: ${error.message}`);
  }
  run.finishedAt = new Date().toISOString();
  writeJson(runFile, run);
  return text;
}

/**
 * Free YouTube slots from now until the next HH:MM (VN time), so a run only makes videos
 * that air before the next run instead of growing the backlog.
 */
export function freeSlotsUntil(until, {
  now = new Date(),
  taken = takenPublishTimes(DEFAULTS.videosDir),
  slots = process.env.YOUTUBE_PUBLISH_SLOTS || DEFAULT_PUBLISH_SLOTS,
  gapMinutes = Number(process.env.YOUTUBE_PUBLISH_GAP_MINUTES) || DEFAULT_PUBLISH_GAP_MINUTES,
} = {}) {
  const [hour, minute] = String(until).split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error(`--until phải dạng HH:MM, nhận "${until}"`);
  const vnToday = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  let end = Date.parse(`${vnToday}T00:00:00+07:00`) + (hour * 60 + minute) * 60_000;
  if (end <= now.getTime()) end += 86_400_000;
  const free = [];
  const claimed = [...taken];
  for (;;) {
    const slot = nextPublishSlot(claimed, {now, slots, gapMinutes});
    if (slot.getTime() > end) return free;
    free.push(slot);
    claimed.push(slot.getTime());
  }
}

function flag(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'candidates') {
      console.log(JSON.stringify(await getCandidates(), null, 2));
    } else if (command === 'select') {
      const run = selectArticles(JSON.parse(args[0] ?? '[]'), {force: args.includes('--force')});
      run.articles.forEach((article, i) => console.log(`${i + 1}. [${article.source}] ${article.title}\n   ${article.link}\n   Lý do: ${article.reason}`));
    } else if (command === 'next') {
      console.log(JSON.stringify(nextArticle()));
    } else if (command === 'record') {
      const article = recordResult({url: flag(args, '--url'), status: flag(args, '--status'), slug: flag(args, '--slug') ?? null, error: flag(args, '--error') ?? null});
      console.log(`✅ Đã ghi ${article.status}: ${article.title}`);
    } else if (command === 'finish') {
      console.log(await finishRun());
    } else if (command === 'free-slots') {
      const free = freeSlotsUntil(flag(args, '--until'));
      console.log(JSON.stringify({count: free.length, slots: free.map((slot) => formatSlotLabel(slot))}));
    } else {
      console.log('Usage: node scripts/tao-tin.mjs candidates | select <json> [--force] | next | record --url <url> --status <s> [--slug <slug>] [--error <text>] | finish | free-slots --until HH:MM');
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
