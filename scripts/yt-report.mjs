#!/usr/bin/env node

// Weekly channel report: YouTube Analytics per uploaded video -> data/performance.json
// (read by /tao-tin when choosing stories) + a short Telegram summary.
// Videos with enough views also get a retention curve (% of viewers still watching at
// each 1% of the video) and the sentence playing where the most viewers leave.
// `--check-schedule` only warns when the next 24h has too few scheduled uploads.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';
import {sendTelegram} from './notify-telegram.mjs';
import {getAuthenticatedYouTubeClient, takenPublishTimes} from './youtube-upload.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_DIR = path.join(ROOT, 'videos');
const OUTPUT = path.join(ROOT, 'data', 'performance.json');
const DAY_MS = 86_400_000;
const MIN_SCHEDULED_NEXT_24H = 6;
const MIN_RETENTION_VIEWS = 100;

const vnDate = (ms) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10);

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function readUploadedVideos(videosDir = VIDEOS_DIR, {sinceMs = 0} = {}) {
  const videos = [];
  for (const slug of fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : []) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(videosDir, slug, 'youtube.json'), 'utf8'));
      const publishMs = Date.parse(meta.publishAt || meta.uploadedAt);
      if (!meta.videoId || !(publishMs >= sinceMs)) continue;
      let seconds = null;
      let hookCardArm = null;
      try {
        const spec = JSON.parse(fs.readFileSync(path.join(videosDir, slug, 'spec.json'), 'utf8'));
        seconds = spec.totalFrames / 30;
        hookCardArm = spec.hookCard?.arm ?? null;
      } catch {
        // spec is optional for the report
      }
      videos.push({slug, videoId: meta.videoId, title: meta.title, publishAt: new Date(publishMs).toISOString(), seconds, hookCardArm});
    } catch {
      // not uploaded or unreadable metadata
    }
  }
  return videos;
}

function parseIsoDuration(iso) {
  const m = String(iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/u);
  if (!m) return null;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

export async function fetchChannelVideos({ytClient, videosDir = VIDEOS_DIR, sinceMs = 0} = {}) {
  const local = new Map(readUploadedVideos(videosDir, {sinceMs: 0}).map((v) => [v.videoId, v]));
  if (!ytClient) return [...local.values()].filter((v) => Date.parse(v.publishAt) >= sinceMs);

  const ch = await ytClient.channels.list({part: ['contentDetails'], mine: true});
  const uploadsId = ch.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [...local.values()].filter((v) => Date.parse(v.publishAt) >= sinceMs);

  const ids = [];
  let pageToken;
  for (let p = 0; p < 4; p += 1) {
    const pl = await ytClient.playlistItems.list({part: ['contentDetails'], playlistId: uploadsId, maxResults: 50, pageToken});
    for (const item of pl.data?.items || []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
    }
    pageToken = pl.data?.nextPageToken;
    if (!pageToken) break;
  }

  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await ytClient.videos.list({part: ['snippet', 'contentDetails', 'status'], id: ids.slice(i, i + 50)});
    for (const v of res.data?.items || []) {
      const pubIso = v.status?.publishAt || v.snippet?.publishedAt;
      const pubMs = Date.parse(pubIso || '');
      if (!(pubMs >= sinceMs)) continue;
      const sec = parseIsoDuration(v.contentDetails?.duration);
      const title = v.snippet?.title || '';
      const loc = local.get(v.id);
      const isShort = title.toLowerCase().includes('#shorts') || (Number.isFinite(sec) && sec <= 90);
      out.push({
        slug: loc?.slug || v.id,
        videoId: v.id,
        title,
        publishAt: new Date(pubMs).toISOString(),
        seconds: sec ?? loc?.seconds ?? null,
        isShort,
        hookCardArm: loc?.hookCardArm ?? null,
      });
    }
  }
  return out;
}

// Steepest 3-point fall after the first 3s (the swipe-away is measured separately); ties keep the latest, closest to the fall.
export function retentionDrop(curve, seconds, segments = []) {
  if (!seconds || curve.length < 10) return null;
  let best = null;
  for (let i = 0; i + 3 < curve.length; i++) {
    const ratio = (i + 1) / curve.length;
    const loss = curve[i] - curve[i + 3];
    if (ratio * seconds >= 3 && (!best || loss >= best.loss)) best = {ratio, loss};
  }
  if (!best) return null;
  const at = Math.round(best.ratio * seconds);
  const text = segments.findLast((segment) => segment.start <= at)?.text ?? null;
  return {at, ratio: best.ratio, loss: best.loss, text};
}

export function scheduledWithin(times, {now = Date.now(), hours = 24} = {}) {
  return times.filter((time) => time > now && time <= now + hours * 3_600_000).length;
}

export function buildSummary({videos, daily, now = Date.now()}) {
  const measured = videos.filter((video) => Number.isFinite(video.apv) && video.views >= 300);
  const byApv = [...measured].sort((a, b) => b.apv - a.apv);
  const totalViews = daily.reduce((sum, day) => sum + day.views, 0);
  const subs = daily.reduce((sum, day) => sum + day.subscribersGained - day.subscribersLost, 0);
  const uploadDays = new Set(videos.map((video) => vnDate(Date.parse(video.publishAt))));
  const emptyDays = daily.filter((day) => !uploadDays.has(day.day)).map((day) => day.day.slice(5));
  const drops = measured.map((video) => video.drop).filter(Boolean);
  const line = (video) => `• ${Math.round(video.apv)}% · ${video.views} view${video.drop ? ` · rời nhiều ở giây ${video.drop.at}` : ''} · ${video.title.replace(/\s*#Shorts$/u, '').slice(0, 70)}`;
  // A/B hook-card: only eligible videos (with a stamped arm) are compared.
  const arm = (name) => measured.filter((video) => video.hookCardArm === name);
  const armLine = (name, videos) =>
    `${name} n=${videos.length} · % xem ${median(videos.map((video) => video.apv))?.toFixed(0) ?? '-'}% · còn ở 30%: ${median(videos.map((video) => video.retention?.[29])) ?? '-'}%`;
  const withText = (video) => (video.drop?.text ? `${line(video)}\n   ↳ "${video.drop.text.slice(0, 90)}"` : line(video));

  const shortsList = videos.filter((v) => v.isShort ?? (String(v.title || '').toLowerCase().includes('#shorts') || (v.seconds && v.seconds <= 90)));
  const longList = videos.filter((v) => !(v.isShort ?? (String(v.title || '').toLowerCase().includes('#shorts') || (v.seconds && v.seconds <= 90))));
  const sumViews = (arr) => arr.reduce((s, v) => s + Number(v.views || 0), 0).toLocaleString('vi-VN');

  return [
    `📊 VN News — ${daily[0]?.day ?? '?'} → ${daily.at(-1)?.day ?? '?'} (Analytics trễ ~2-3 ngày)`,
    `View: ${totalViews.toLocaleString('vi-VN')} · Sub ròng: ${subs >= 0 ? '+' : ''}${subs} · ${videos.length} video`,
    `Shorts: ${shortsList.length} video · ${sumViews(shortsList)} view | Video dài: ${longList.length} video · ${sumViews(longList)} view`,
    `% xem trung vị: ${median(measured.map((video) => video.apv))?.toFixed(1) ?? '-'}% · Video ≥1.500 view: ${videos.filter((video) => video.views >= 1500).length}`,
    ...(drops.length ? [`Người xem rời nhiều nhất ở ~${Math.round(median(drops.map((drop) => drop.ratio)) * 100)}% thời lượng (trung vị giây ${median(drops.map((drop) => drop.at))})`] : []),
    ...(arm('card').length || arm('control').length
      ? [`🧪 A/B thẻ hook: ${armLine('có thẻ', arm('card'))} | ${armLine('không thẻ', arm('control'))}`]
      : []),
    emptyDays.length ? `⚠️ Ngày không đăng video: ${emptyDays.join(', ')}` : '✅ Ngày nào cũng có video mới',
    '',
    'Giữ chân tốt nhất:',
    ...byApv.slice(0, 3).map(line),
    '',
    'Giữ chân kém nhất:',
    ...byApv.slice(-3).reverse().map(withText),
    '',
    `Cập nhật lúc ${new Date(now).toISOString().slice(0, 16)}Z`,
  ].join('\n');
}

function analyticsClient(env = process.env) {
  const auth = new google.auth.OAuth2(env.YOUTUBE_CLIENT_ID, env.YOUTUBE_CLIENT_SECRET);
  auth.setCredentials({refresh_token: env.YOUTUBE_REFRESH_TOKEN});
  return google.youtubeAnalytics({version: 'v2', auth});
}

export async function buildReport({days = 14, now = Date.now(), client = analyticsClient(), ytClient = getAuthenticatedYouTubeClient()} = {}) {
  const startDate = vnDate(now - days * DAY_MS);
  const endDate = vnDate(now);
  const videos = await fetchChannelVideos({ytClient, videosDir: VIDEOS_DIR, sinceMs: Date.parse(`${startDate}T00:00:00+07:00`)});
  const base = {ids: 'channel==MINE', startDate, endDate};

  const metrics = {};
  for (let i = 0; i < videos.length; i += 50) {
    const ids = videos.slice(i, i + 50).map((video) => video.videoId).join(',');
    const {data} = await client.reports.query({
      ...base,
      dimensions: 'video',
      metrics: 'views,averageViewPercentage,averageViewDuration,subscribersGained',
      filters: `video==${ids}`,
      maxResults: 200,
    });
    for (const [id, views, apv, avd, subs] of data.rows ?? []) metrics[id] = {views, apv, avd, subs};
  }
  const {data: dailyData} = await client.reports.query({
    ...base,
    dimensions: 'day',
    metrics: 'views,subscribersGained,subscribersLost',
  });
  const daily = (dailyData.rows ?? []).map(([day, views, subscribersGained, subscribersLost]) => ({day, views, subscribersGained, subscribersLost}));
  const rows = videos.map((video) => ({...video, views: 0, apv: null, avd: null, subs: 0, ...metrics[video.videoId]}));
  for (const video of rows.filter((row) => row.views >= MIN_RETENTION_VIEWS)) {
    const {data} = await client.reports.query({
      ...base,
      dimensions: 'elapsedVideoTimeRatio',
      metrics: 'audienceWatchRatio',
      filters: `video==${video.videoId}`,
    });
    video.retention = (data.rows ?? []).map(([, watchRatio]) => Math.round(watchRatio * 100));
    let segments = [];
    try {
      segments = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', video.slug, 'timeline.json'), 'utf8')).segments ?? [];
    } catch {
      // timeline may have been cleaned from public/
    }
    video.drop = retentionDrop(video.retention, video.seconds, segments);
  }

  return {generatedAt: new Date(now).toISOString(), startDate, endDate, daily, videos: rows};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--check-schedule')) {
      const count = scheduledWithin(takenPublishTimes(VIDEOS_DIR));
      const text = `${count < MIN_SCHEDULED_NEXT_24H ? '⚠️' : '✅'} VN News: ${count} video đã hẹn giờ trong 24 giờ tới (cần ≥${MIN_SCHEDULED_NEXT_24H}).${count < MIN_SCHEDULED_NEXT_24H ? ' Chạy /tao-tin để lấp lịch.' : ''}`;
      console.log(text);
      if (count < MIN_SCHEDULED_NEXT_24H && args.includes('--telegram')) await sendTelegram(text);
    } else {
      const daysArg = Number(args[args.indexOf('--days') + 1]);
      const report = await buildReport({days: args.includes('--days') && daysArg > 0 ? daysArg : 14});
      fs.mkdirSync(path.dirname(OUTPUT), {recursive: true});
      // Keep each retention curve on one line so the file stays readable.
      const json = JSON.stringify(report, null, 2).replace(/\[\s+(-?\d[\d\s,.-]*?)\s+\]/g, (_, numbers) => `[${numbers.split(/,\s*/).join(',')}]`);
      fs.writeFileSync(OUTPUT, `${json}\n`);
      const summary = buildSummary(report);
      console.log(`${summary}\n\nĐã ghi ${path.relative(ROOT, OUTPUT)}`);
      if (args.includes('--telegram')) await sendTelegram(summary);
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  }
}
