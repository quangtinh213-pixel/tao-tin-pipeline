#!/usr/bin/env node
// Đăng Reel lên Facebook Page qua Graph API (port từ dự án Hùng Đông Y: scripts/dang_bai.py).

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findEligibleVideos as findRenderedVideos, isLongFormSpec, nextPublishSlot} from './youtube-upload.mjs';
import {GENERIC_CAPTION_NOTES, GENERIC_CAPTION_CTAS} from './caption-rules.mjs';
// Reels giữ lưới cũ (không có 15:30/16:30) để vẫn ≈3 Reel/ngày với khoảng cách 120 phút.
const FB_DEFAULT_PUBLISH_SLOTS = '11:30,12:00,12:30,13:00,18:00,18:30,19:00,19:30,21:00,21:30,22:00,22:30';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VIDEOS_DIR = path.join(ROOT, 'videos');
const DEFAULT_GRAPH_API = 'v26.0';
// Page nhỏ: đăng dồn dập bị coi là spam, nên giãn ≥2 giờ (≈3 Reel/ngày trên khung giờ vàng).
const DEFAULT_GAP_MINUTES = 120;
// Tin thời sự quá 1 ngày gần như không còn người xem.
const DEFAULT_MAX_AGE_HOURS = 24;
const FB_HASHTAG_LIMIT = 4;

export function hideToken(text, token) {
  return token ? String(text).split(token).join('***') : String(text);
}

/**
 * Gọi Graph API. `body` là Buffer để tải nguyên khối lên rupload.
 */
export async function graphRequest(method, url, params = {}, headers = {}, body) {
  const opts = {method, headers: {...headers}};
  if (body) {
    opts.body = body;
    opts.headers['Content-Type'] = 'application/octet-stream';
  } else if (method === 'GET') {
    url += (url.includes('?') ? '&' : '?') + new URLSearchParams(params);
  } else {
    opts.body = new URLSearchParams(params);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) throw new Error(`Graph API lỗi HTTP ${res.status}`);
  }
  if (!res.ok || data.error) {
    const err = data.error || {};
    throw new Error(`Graph API lỗi ${err.code || res.status}: ${err.message || res.statusText}`);
  }
  return data;
}

/**
 * Token trong .env có thể là token người dùng: đổi sang token của Page (chỉ giữ trong bộ nhớ).
 */
export async function resolvePageToken(token, pageId, graphApi, request = graphRequest) {
  const base = `https://graph.facebook.com/${graphApi}`;
  const me = await request('GET', `${base}/me`, {fields: 'id', access_token: token});
  if (me.id === pageId) return token;
  const pages = await request('GET', `${base}/me/accounts`, {fields: 'id,access_token', limit: '100', access_token: token});
  const page = (pages.data || []).find((p) => p.id === pageId && p.access_token);
  if (!page) {
    throw new Error(`token trong .env không quản lý được Page ${pageId} (thiếu quyền pages_show_list hoặc không phải quản trị Page)`);
  }
  return page.access_token;
}

/**
 * Tải Reel lên theo 3 pha (start → rupload → finish) và đăng ngay; trả video_id.
 */
/**
 * caption.txt viết cho YouTube (100–180 từ, 10–15 hashtag). Reel cần ngắn: bỏ câu mẫu,
 * giữ một câu hỏi, chỉ #VnNews213 + 3 hashtag chủ đề (bỏ 4 hashtag khám phá chung đứng sau #VnNews213).
 */
export function formatFacebookDescription(caption) {
  const paragraphs = String(caption || '').split(/\n\s*\n/u).map((p) => p.trim()).filter(Boolean);
  const isHashtags = (p) => /^(#[\p{L}\p{N}_-]+\s*)+$/u.test(p);
  const tags = (paragraphs.find(isHashtags) || '').split(/\s+/u).filter(Boolean);
  const body = paragraphs.filter((p) => !isHashtags(p) && !GENERIC_CAPTION_NOTES.includes(p));
  const specific = body.filter((p) => !GENERIC_CAPTION_CTAS.includes(p));
  const lines = specific.slice(1).some((p) => p.endsWith('?'))
    ? specific
    : [...specific, body.findLast((p) => GENERIC_CAPTION_CTAS.includes(p))];
  const hashtags = [tags[0], ...tags.slice(5, 4 + FB_HASHTAG_LIMIT)].filter(Boolean).join(' ');
  return [...lines, hashtags].filter(Boolean).join('\n\n');
}

/**
 * Giờ đăng các Reel đã có (hẹn giờ hoặc đăng ngay) để giãn lịch.
 */
export function takenReelTimes(videosDir = DEFAULT_VIDEOS_DIR) {
  if (!fs.existsSync(videosDir)) return [];
  return fs.readdirSync(videosDir).flatMap((slug) => {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(videosDir, slug, 'facebook.json'), 'utf8'));
      const time = Date.parse(meta.publishAt || meta.uploadedAt);
      return Number.isFinite(time) ? [time] : [];
    } catch {
      return [];
    }
  });
}

export async function publishReel({videoPath, description, pageId, graphApi, token, publishAt = null, request = graphRequest}) {
  const api = `https://graph.facebook.com/${graphApi}/${pageId}/video_reels`;
  const {video_id: videoId} = await request('POST', api, {upload_phase: 'start', access_token: token});
  await request('POST', `https://rupload.facebook.com/video-upload/${graphApi}/${videoId}`, {}, {
    Authorization: `OAuth ${token}`,
    offset: '0',
    file_size: String(fs.statSync(videoPath).size),
  }, fs.readFileSync(videoPath));
  const result = await request('POST', api, {
    upload_phase: 'finish',
    video_id: videoId,
    ...(publishAt
      ? {video_state: 'SCHEDULED', scheduled_publish_time: String(Math.floor(Date.parse(publishAt) / 1000))}
      : {video_state: 'PUBLISHED'}),
    is_ai_generated: 'true',
    description,
    access_token: token,
  });
  if (result.success === false) throw new Error('Graph API: bước finish không thành công');
  return videoId;
}

export function isAlreadyPosted(slug, videosDir = DEFAULT_VIDEOS_DIR) {
  try {
    return Boolean(JSON.parse(fs.readFileSync(path.join(videosDir, slug, 'facebook.json'), 'utf8')).videoId);
  } catch {
    return false;
  }
}

export async function uploadReel(slug, options = {}) {
  const {
    videosDir = DEFAULT_VIDEOS_DIR,
    force = false,
    publishNow = false,
    now = new Date(),
    env = process.env,
    log = console.log,
    request = graphRequest,
  } = options;
  const slugDir = path.join(videosDir, slug);
  const videoPath = path.join(slugDir, 'output', 'video.mp4');
  const metaPath = path.join(slugDir, 'facebook.json');

  if (!fs.existsSync(videoPath)) throw new Error(`Không tìm thấy file video thành phẩm tại: ${videoPath}`);
  const specPath = path.join(slugDir, 'spec.json');
  if (fs.existsSync(specPath) && isLongFormSpec(JSON.parse(fs.readFileSync(specPath, 'utf8')))) {
    log(`[BỎ QUA] "${slug}" là video dài 16:9, không đăng thành Reel.`);
    return null;
  }
  if (!force && isAlreadyPosted(slug, videosDir)) {
    const existing = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    log(`[BỎ QUA] Reel "${slug}" đã đăng trước đó: ${existing.url || existing.videoId}`);
    return existing;
  }
  const maxAgeHours = Number(env.FB_MAX_AGE_HOURS) || DEFAULT_MAX_AGE_HOURS;
  const ageHours = (now.getTime() - fs.statSync(videoPath).mtimeMs) / 3_600_000;
  if (!force && ageHours > maxAgeHours) {
    log(`[BỎ QUA] Reel "${slug}" render đã ${Math.round(ageHours)} giờ (> ${maxAgeHours} giờ) — tin cũ. Dùng --force nếu vẫn muốn đăng.`);
    return null;
  }

  const rawToken = (env.FB_PAGE_TOKEN || '').trim();
  const pageId = (env.FB_PAGE_ID || '').trim();
  const graphApi = env.FB_GRAPH_API || DEFAULT_GRAPH_API;
  if (!rawToken || !pageId) {
    throw new Error('Chưa cấu hình FB_PAGE_TOKEN và FB_PAGE_ID trong .env — xem docs/SKILL-FACEBOOK-REEL.md');
  }

  const captionPath = path.join(slugDir, 'caption.txt');
  const description = fs.existsSync(captionPath) ? formatFacebookDescription(fs.readFileSync(captionPath, 'utf8')) : '';
  const slots = env.FB_PUBLISH_SLOTS || FB_DEFAULT_PUBLISH_SLOTS;
  const gapMinutes = Number(env.FB_PUBLISH_GAP_MINUTES) || DEFAULT_GAP_MINUTES;
  const publishAt = publishNow || slots === 'off'
    ? null
    : nextPublishSlot(takenReelTimes(videosDir), {now, slots, gapMinutes}).toISOString();

  try {
    const token = await resolvePageToken(rawToken, pageId, graphApi, request);
    log(`\n🚀 Đăng Reel Facebook: ${slug} (${(fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2)} MB)`);
    const videoId = await publishReel({videoPath, description, pageId, graphApi, token, publishAt, request});
    const record = {
      videoId,
      url: `https://www.facebook.com/reel/${videoId}`,
      pageId,
      uploadedAt: now.toISOString(),
      ...(publishAt && {publishAt}),
      slug,
    };
    fs.writeFileSync(metaPath, JSON.stringify(record, null, 2), 'utf8');
    log(publishAt
      ? `✅ Đã hẹn Reel lên sóng ${new Date(publishAt).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}: ${record.url}`
      : `✅ Đã đăng Reel: ${record.url}`);
    return record;
  } catch (err) {
    throw new Error(hideToken(err.message, rawToken));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const publishNow = args.includes('--now');

  (async () => {
    try {
      if (args.includes('--help') || args.includes('-h')) {
        console.log('Sử dụng: node scripts/facebook-reel-upload.mjs [<slug> | --latest | --all] [--force] [--now]');
        return;
      }
      if (args.includes('--all')) {
        const pending = findRenderedVideos(DEFAULT_VIDEOS_DIR, {force: true})
          .filter((v) => force || !isAlreadyPosted(v.slug));
        if (pending.length === 0) console.log('Không có video nào cần đăng Reel.');
        for (const item of pending) await uploadReel(item.slug, {force, publishNow});
        return;
      }
      let slug = args.find((a) => !a.startsWith('--'));
      if (!slug) {
        slug = findRenderedVideos(DEFAULT_VIDEOS_DIR, {force: true})[0]?.slug;
        if (!slug) throw new Error('Không tìm thấy video nào đã render trong thư mục videos/.');
        console.log(`Chọn video mới nhất: ${slug}`);
      }
      await uploadReel(slug, {force, publishNow});
    } catch (error) {
      console.error('\n❌ Lỗi:', error.message || error);
      process.exit(1);
    }
  })();
}
