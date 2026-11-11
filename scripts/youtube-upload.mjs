#!/usr/bin/env node

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {google} from 'googleapis';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VIDEOS_DIR = path.join(ROOT, 'videos');
const DEFAULT_CATEGORY_ID = '25'; // News & Politics
const DEFAULT_PRIVACY = 'public';
const MAX_TITLE_LENGTH = 100;
const MAX_TAGS_LENGTH = 500;
// Giờ vàng xem tin (giờ Việt Nam): sáng 07:00/07:30 (1–2 tin, đang thử, chưa có số liệu), nghỉ trưa, chiều (15:30/16:30 có APV tốt nhất 10/2026), tan sở, trước khi ngủ.
export const DEFAULT_PUBLISH_SLOTS =
  '07:00,07:30,11:30,12:00,12:30,13:00,15:30,16:30,18:00,18:30,19:00,19:30,21:00,21:30,22:00,22:30';
export const DEFAULT_PUBLISH_GAP_MINUTES = 60;
// Video dài: 2 video/ngày, trưa (12:00) và tối (20:00) — khung giờ dự kiến, chỉnh theo số liệu thật sau 2 tuần.
export const DEFAULT_LONG_PUBLISH_SLOTS = '12:00,20:00';
export const DEFAULT_LONG_PUBLISH_GAP_MINUTES = 240;
// YouTube cần publishAt ở tương lai và thời gian xử lý video sau upload.
const MIN_PUBLISH_LEAD_MS = 15 * 60_000;
const DAY_MS = 86_400_000;

/**
 * Format title for YouTube (<= 100 characters, optional #Shorts tag)
 */
export function formatYouTubeTitle(rawTitle, options = {}) {
  const {isShorts = true} = options;
  let title = (rawTitle || '').trim().replace(/\s+/g, ' ');
  const suffix = isShorts && !title.toLowerCase().includes('#shorts') ? ' #Shorts' : '';

  if ((title + suffix).length <= MAX_TITLE_LENGTH) {
    return `${title}${suffix}`;
  }

  // Truncate title to fit within MAX_TITLE_LENGTH including suffix
  const maxBaseLength = MAX_TITLE_LENGTH - suffix.length - 3; // reserve 3 chars for ellipsis '...'
  const truncated = title.slice(0, Math.max(0, maxBaseLength)).trim();
  return `${truncated}...${suffix}`;
}

/**
 * Extract tags from caption text and merge with defaults
 */
export function extractTagsFromCaption(captionText, additionalTags = ['VnNews213', 'tintuc', 'Shorts']) {
  const tagsSet = new Set();

  for (const tag of additionalTags) {
    if (tag && typeof tag === 'string') {
      tagsSet.add(tag.replace(/^#/, '').trim());
    }
  }

  if (captionText) {
    const hashtagMatches = captionText.match(/#([A-Za-z0-9_À-ỹ]+)/gu) || [];
    for (const match of hashtagMatches) {
      const clean = match.replace(/^#/, '').trim();
      if (clean) {
        tagsSet.add(clean);
      }
    }
  }

  const result = [];
  let totalLength = 0;

  for (const tag of tagsSet) {
    if (totalLength + tag.length + 1 > MAX_TAGS_LENGTH) {
      break;
    }
    result.push(tag);
    totalLength += tag.length + 1;
  }

  return result;
}

/**
 * Format description for YouTube from caption and source info
 */
export function formatYouTubeDescription(captionText, sourceUrl = '') {
  let description = (captionText || '').trim();

  if (sourceUrl && !description.includes(sourceUrl)) {
    description += `\n\n📌 Nguồn tin: ${sourceUrl}`;
  }

  return description;
}

/**
 * YouTube chapter block from spec.chapters ({title, startFrame}). YouTube only renders
 * chapters when the first is 00:00, there are 3+, and each lasts 10s+; otherwise return ''.
 */
export function formatYouTubeChapters(spec) {
  const fps = spec?.fps || 30;
  const chapters = Array.isArray(spec?.chapters) ? spec.chapters : [];
  const starts = chapters.map((c) => Math.floor(c.startFrame / fps));
  const ends = [...starts.slice(1), Math.floor((spec?.totalFrames || 0) / fps)];
  if (chapters.length < 3 || starts[0] !== 0 || starts.some((t, i) => ends[i] - t < 10)) return '';
  const stamp = (t) => {
    const h = Math.floor(t / 3600);
    const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  return ['⏱ Mốc chương', ...chapters.map((c, i) => `${stamp(starts[i])} ${c.title}`)].join('\n');
}

/**
 * SRT captions from timeline words: a cue ends at a sentence end, a pause over maxGap seconds, or maxWords words.
 */
export function timelineToSrt(words, {maxWords = 10, maxGap = 0.6} = {}) {
  const stamp = (t) => {
    const ms = Math.max(0, Math.round(t * 1000));
    const pad = (n, w = 2) => String(n).padStart(w, '0');
    return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))},${pad(ms % 1000, 3)}`;
  };
  const cues = [];
  let cue = [];
  words.forEach((w, i) => {
    cue.push(w);
    const next = words[i + 1];
    if (!next || cue.length >= maxWords || /[.?!…]$/u.test(w.word) || next.start - w.end > maxGap) {
      cues.push(cue);
      cue = [];
    }
  });
  return cues.map((c, i) => `${i + 1}\n${stamp(c[0].start)} --> ${stamp(c[c.length - 1].end)}\n${c.map((w) => w.word).join(' ')}\n`).join('\n');
}

/** A spec with a landscape canvas (video.width > video.height) is a long-form video, not a Short. */
export function isLongFormSpec(spec) {
  return Boolean(spec?.video?.width && spec?.video?.height && spec.video.width > spec.video.height);
}

/**
 * Check if a video slug has already been uploaded
 */
export function isAlreadyUploaded(slug, videosDir = DEFAULT_VIDEOS_DIR) {
  const metaPath = path.join(videosDir, slug, 'youtube.json');
  if (!fs.existsSync(metaPath)) {
    return false;
  }

  try {
    const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return Boolean(data && data.videoId);
  } catch {
    return false;
  }
}

/**
 * Record YouTube upload result into videos/<slug>/youtube.json
 */
export function recordUploadResult(slug, uploadData, videosDir = DEFAULT_VIDEOS_DIR) {
  const metaPath = path.join(videosDir, slug, 'youtube.json');
  fs.writeFileSync(metaPath, JSON.stringify(uploadData, null, 2), 'utf8');
}

/**
 * Find all video directories that contain output/video.mp4 and haven't been uploaded yet
 */
export function findEligibleVideos(videosDir = DEFAULT_VIDEOS_DIR, options = {}) {
  const {force = false} = options;
  if (!fs.existsSync(videosDir)) {
    return [];
  }

  const entries = fs.readdirSync(videosDir, {withFileTypes: true});
  const eligible = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const videoFile = path.join(videosDir, slug, 'output', 'video.mp4');

    if (fs.existsSync(videoFile)) {
      if (force || !isAlreadyUploaded(slug, videosDir)) {
        eligible.push({
          slug,
          videoPath: videoFile,
          mtime: fs.statSync(videoFile).mtimeMs,
        });
      }
    }
  }

  return eligible.sort((a, b) => b.mtime - a.mtime);
}

/**
 * Find the latest rendered video
 */
export function findLatestVideo(videosDir = DEFAULT_VIDEOS_DIR) {
  const videos = findEligibleVideos(videosDir, {force: true});
  return videos.length > 0 ? videos[0].slug : null;
}

/**
 * Publish times already claimed by uploaded videos (scheduled or public-now).
 */
export function takenPublishTimes(videosDir = DEFAULT_VIDEOS_DIR, {onlySlugs = null} = {}) {
  if (!fs.existsSync(videosDir)) return [];
  const times = [];
  for (const entry of fs.readdirSync(videosDir, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    if (onlySlugs && !onlySlugs.has(entry.name)) continue;
    const metaPath = path.join(videosDir, entry.name, 'youtube.json');
    if (!fs.existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const time = Date.parse(meta.publishAt || (meta.privacyStatus === 'public' ? meta.uploadedAt : ''));
      if (Number.isFinite(time)) times.push(time);
    } catch {
      // Ignore unreadable metadata
    }
  }
  return times;
}

/** Long-form (16:9) publish slots in VN time: two a day by default, at least 4h apart. */
export function longSlotOptions(env = process.env) {
  return {
    slots: env.YOUTUBE_LONG_PUBLISH_SLOTS || DEFAULT_LONG_PUBLISH_SLOTS,
    gapMinutes: Number(env.YOUTUBE_LONG_PUBLISH_GAP_MINUTES) || DEFAULT_LONG_PUBLISH_GAP_MINUTES,
  };
}

/** Publish times already taken by long-form videos only (Shorts keep their own grid). */
export function takenLongPublishTimes(videosDir = DEFAULT_VIDEOS_DIR) {
  const onlySlugs = new Set(fs.existsSync(videosDir)
    ? fs.readdirSync(videosDir).filter((slug) => {
      try {
        return isLongFormSpec(JSON.parse(fs.readFileSync(path.join(videosDir, slug, 'spec.json'), 'utf8')));
      } catch {
        return false;
      }
    })
    : []);
  return takenPublishTimes(videosDir, {onlySlugs});
}

/**
 * Earliest slot (Asia/Ho_Chi_Minh, UTC+7, no DST) at least gapMinutes away from every taken time.
 */
export function nextPublishSlot(taken, {
  now = new Date(),
  slots = DEFAULT_PUBLISH_SLOTS,
  gapMinutes = DEFAULT_PUBLISH_GAP_MINUTES,
} = {}) {
  const gapMs = gapMinutes * 60_000;
  const minutes = slots.split(',').map((slot) => {
    const [hour, minute] = slot.trim().split(':').map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error(`Khung giờ đăng không hợp lệ: "${slot}"`);
    return hour * 60 + minute;
  }).sort((a, b) => a - b);
  const vnToday = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  const dayStart = Date.parse(`${vnToday}T00:00:00+07:00`);
  for (let day = 0; day < 60; day += 1) {
    for (const minute of minutes) {
      const time = dayStart + day * DAY_MS + minute * 60_000;
      if (time < now.getTime() + MIN_PUBLISH_LEAD_MS) continue;
      if (taken.every((other) => Math.abs(other - time) >= gapMs)) return new Date(time);
    }
  }
  throw new Error('Không còn khung giờ đăng trống trong 60 ngày tới.');
}

/**
 * Create an authenticated YouTube client
 */
export function getAuthenticatedYouTubeClient(env = process.env) {
  const clientId = env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Chưa cấu hình đầy đủ YouTube OAuth credentials trong .env!\n' +
      'Vui lòng đảm bảo các biến sau đã được thiết lập:\n' +
      '  - YOUTUBE_CLIENT_ID\n' +
      '  - YOUTUBE_CLIENT_SECRET\n' +
      '  - YOUTUBE_REFRESH_TOKEN\n\n' +
      'Chạy lệnh: npm run youtube:auth để thực hiện xác thực và lấy Refresh Token tự động.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({refresh_token: refreshToken});

  return google.youtube({version: 'v3', auth: oauth2Client});
}

/**
 * Upload a single video to YouTube
 */
export async function uploadVideo(slug, options = {}) {
  const {
    videosDir = DEFAULT_VIDEOS_DIR,
    force = false,
    privacy,
    publishNow = false,
    env = process.env,
    log = console.log,
  } = options;

  const slugDir = path.join(videosDir, slug);
  const videoPath = path.join(slugDir, 'output', 'video.mp4');

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Không tìm thấy file video thành phẩm tại: ${videoPath}`);
  }

  if (!force && isAlreadyUploaded(slug, videosDir)) {
    const existing = JSON.parse(fs.readFileSync(path.join(slugDir, 'youtube.json'), 'utf8'));
    log(`[BỎ QUA] Video "${slug}" đã được tải lên trước đó: ${existing.url || existing.videoId}`);
    return existing;
  }

  // Read metadata
  let rawTitle = slug;
  let sourceUrl = '';
  let spec = null;
  const specPath = path.join(slugDir, 'spec.json');
  if (fs.existsSync(specPath)) {
    try {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
      if (spec.video && spec.video.title) {
        rawTitle = spec.video.title;
      }
      if (spec.source && spec.source.articleUrl) {
        sourceUrl = spec.source.articleUrl;
      } else if (Array.isArray(spec.sources)) {
        sourceUrl = spec.sources.map((source) => source.url).filter(Boolean).join('\n');
      }
    } catch {
      // Ignore JSON parse error in spec
    }
  }

  let captionText = '';
  const captionPath = path.join(slugDir, 'caption.txt');
  if (fs.existsSync(captionPath)) {
    captionText = fs.readFileSync(captionPath, 'utf8');
  }

  const isShorts = !isLongFormSpec(spec);
  const title = formatYouTubeTitle(rawTitle, {isShorts});
  const chapters = isShorts ? '' : formatYouTubeChapters(spec);
  const description = formatYouTubeDescription(chapters ? `${captionText.trim()}\n\n${chapters}` : captionText, sourceUrl);
  const tags = extractTagsFromCaption(captionText, ['VnNews213', 'VNNews', 'tintuc', isShorts ? 'Shorts' : 'giaithich']);
  const categoryId = env.YOUTUBE_CATEGORY_ID || DEFAULT_CATEGORY_ID;
  const targetPrivacy = privacy || env.YOUTUBE_PRIVACY_STATUS || DEFAULT_PRIVACY;
  const {slots, gapMinutes} = isShorts
    ? {slots: env.YOUTUBE_PUBLISH_SLOTS || DEFAULT_PUBLISH_SLOTS, gapMinutes: Number(env.YOUTUBE_PUBLISH_GAP_MINUTES) || DEFAULT_PUBLISH_GAP_MINUTES}
    : longSlotOptions(env);
  const takenTimes = isShorts ? takenPublishTimes(videosDir) : takenLongPublishTimes(videosDir);
  // Video hẹn giờ phải upload ở private; YouTube tự chuyển public đúng publishAt.
  const publishAt = targetPrivacy === 'public' && !publishNow && slots !== 'off'
    ? nextPublishSlot(takenTimes, {slots, gapMinutes}).toISOString()
    : null;
  const privacyStatus = publishAt ? 'private' : targetPrivacy;

  const youtube = getAuthenticatedYouTubeClient(env);
  const fileSize = fs.statSync(videoPath).size;

  log(`\n🚀 Chuẩn bị upload video lên kênh YouTube VNNews...`);
  log(`   📁 Slug:        ${slug}`);
  log(`   🎬 Tiêu đề:     ${title}`);
  log(`   🔒 Trạng thái:  ${publishAt ? `hẹn đăng public lúc ${formatVnTime(publishAt)}` : privacyStatus}`);
  log(`   🏷️  Thẻ (tags):  ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? ` (+${tags.length - 5} tags)` : ''}`);
  log(`   📦 Dung lượng:  ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId,
        defaultLanguage: 'vi',
        defaultAudioLanguage: 'vi',
      },
      status: {
        privacyStatus,
        ...(publishAt && {publishAt}),
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = res.data.id;
  const videoUrl = `https://youtu.be/${videoId}`;

  const uploadRecord = {
    videoId,
    url: videoUrl,
    title,
    privacyStatus,
    ...(publishAt && {publishAt}),
    categoryId,
    uploadedAt: new Date().toISOString(),
    slug,
  };

  recordUploadResult(slug, uploadRecord, videosDir);

  // Long-form ships captions as a track (no burned-in subtitles). A caption failure never fails the upload.
  const timelinePath = path.join(ROOT, 'public', slug, 'timeline.json');
  if (!isShorts && fs.existsSync(timelinePath)) {
    const srtPath = path.join(slugDir, 'output', 'captions.vi.srt');
    try {
      fs.writeFileSync(srtPath, timelineToSrt(JSON.parse(fs.readFileSync(timelinePath, 'utf8')).words ?? []));
      await youtube.captions.insert({
        part: ['snippet'],
        requestBody: {snippet: {videoId, language: 'vi', name: 'Tiếng Việt', isDraft: false}},
        media: {mimeType: 'application/octet-stream', body: fs.createReadStream(srtPath)},
      });
      log(`   💬 Đã tải phụ đề tiếng Việt (${path.relative(ROOT, srtPath)})`);
    } catch (error) {
      log(`   ⚠️  Không tải được phụ đề: ${error.message}. File vẫn ở ${path.relative(ROOT, srtPath)} để tải tay trong YouTube Studio.`);
    }
  }

  log(`\n✅ TẢI LÊN THÀNH CÔNG!`);
  log(`   🔗 Video URL: ${videoUrl}`);
  if (publishAt) log(`   ⏰ Lên sóng:  ${formatVnTime(publishAt)} (giờ Việt Nam)`);
  log(`   📄 Đã lưu thông tin vào: ${path.join('videos', slug, 'youtube.json')}\n`);

  return uploadRecord;
}

export function formatVnTime(iso) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false,
  }).format(new Date(iso));
}

/**
 * Watch mode daemon: scans every interval for new rendered videos
 */
export async function startWatchMode(options = {}) {
  const {
    videosDir = DEFAULT_VIDEOS_DIR,
    intervalMs = 10000,
    env = process.env,
    log = console.log,
  } = options;

  log(`\n👀 Đang khởi động chế độ YouTube Auto-Upload Watcher...`);
  log(`   📁 Giám sát thư mục: ${videosDir}`);
  log(`   ⏱️  Chu kỳ quét:      ${intervalMs / 1000}s\n`);

  const poll = async () => {
    try {
      const eligible = findEligibleVideos(videosDir);
      if (eligible.length > 0) {
        log(`[Watcher] Phát hiện ${eligible.length} video mới cần upload!`);
        for (const item of eligible) {
          try {
            await uploadVideo(item.slug, {videosDir, env, log});
          } catch (err) {
            console.error(`[Watcher] Lỗi khi upload ${item.slug}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error(`[Watcher] Lỗi quét thư mục:`, err.message);
    }
  };

  await poll();
  setInterval(poll, intervalMs);
}

// CLI Execution Entry Point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);

  const usage = `
Sử dụng:
  node scripts/youtube-upload.mjs <slug>                 # Upload 1 video theo slug
  node scripts/youtube-upload.mjs --latest               # Upload video mới nhất vừa render
  node scripts/youtube-upload.mjs --all                  # Upload tất cả video chưa được tải lên
  node scripts/youtube-upload.mjs --watch                # Chạy chế độ ngầm theo dõi và tự upload
  
Tùy chọn bổ sung:
  --force                                                # Upload lại kể cả khi đã có youtube.json
  --privacy <public|unlisted|private>                    # Ghi đè trạng thái hiển thị video
  --now                                                  # Đăng public ngay, bỏ qua hẹn giờ khung vàng
  --help                                                 # Hiển thị hướng dẫn
  `;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    process.exit(0);
  }

  const force = args.includes('--force');
  const isWatch = args.includes('--watch');
  const isAll = args.includes('--all');
  const isLatest = args.includes('--latest');
  const publishNow = args.includes('--now');

  let privacy;
  const privacyIndex = args.indexOf('--privacy');
  if (privacyIndex !== -1 && args[privacyIndex + 1]) {
    privacy = args[privacyIndex + 1];
  }

  (async () => {
    try {
      if (isWatch) {
        await startWatchMode();
        return;
      }

      if (isAll) {
        const eligible = findEligibleVideos(DEFAULT_VIDEOS_DIR, {force});
        if (eligible.length === 0) {
          console.log('Không có video nào cần upload.');
          process.exit(0);
        }
        console.log(`Tìm thấy ${eligible.length} video cần upload.`);
        for (const item of eligible) {
          await uploadVideo(item.slug, {force, privacy, publishNow});
        }
        process.exit(0);
      }

      let targetSlug = args.find((arg) => !arg.startsWith('--'));

      if (isLatest || !targetSlug) {
        targetSlug = findLatestVideo(DEFAULT_VIDEOS_DIR);
        if (!targetSlug) {
          console.error('Không tìm thấy video nào đã render trong thư mục videos/.');
          process.exit(1);
        }
        console.log(`Chọn video mới nhất: ${targetSlug}`);
      }

      await uploadVideo(targetSlug, {force, privacy, publishNow});
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Lỗi:', error.message || error);
      process.exit(1);
    }
  })();
}
