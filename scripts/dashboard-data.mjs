import {readdir, readFile, stat} from 'node:fs/promises';
import {basename, isAbsolute, join, relative, resolve} from 'node:path';

function invalidSlugError(slug) {
  const error = new Error(`Invalid slug: ${slug}`);
  error.code = 'DASHBOARD_INVALID_SLUG';
  return error;
}

export function resolveVideoDirectory(videosDir, slug) {
  if (typeof slug !== 'string' || !slug || slug === '.' || slug === '..') {
    throw invalidSlugError(slug);
  }

  const root = resolve(videosDir);
  const candidate = resolve(root, slug);
  const relativePath = relative(root, candidate);
  if (
    slug !== basename(slug) ||
    slug.includes('\\') ||
    relativePath.startsWith('..') ||
    isAbsolute(relativePath)
  ) {
    throw invalidSlugError(slug);
  }

  return candidate;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function readOptionalText(filePath) {
  try {
    const value = (await readFile(filePath, 'utf8')).trim();
    return value || null;
  } catch {
    return null;
  }
}

function normalizeScriptPayload(payload) {
  if (!payload || !Array.isArray(payload.script)) return null;

  const segments = payload.script
    .map((segment) => (typeof segment?.text === 'string' ? segment.text.trim() : ''))
    .filter(Boolean);

  return segments.length > 0 ? segments.join('\n\n') : null;
}

async function readScriptTextFromDirectory(videoDir) {
  const payload = await readJson(join(videoDir, 'script', 'script.json'));
  return normalizeScriptPayload(payload);
}

async function readCaptionTextFromDirectory(videoDir) {
  try {
    const value = (await readFile(join(videoDir, 'caption.txt'), 'utf8'))
      .replace(/\r\n/gu, '\n')
      .replace(/\n$/u, '');
    return value.trim() ? value : null;
  } catch {
    return null;
  }
}

async function readRenderedVideo(videoDir) {
  const videoPath = join(videoDir, 'output', 'video.mp4');
  try {
    const videoStats = await stat(videoPath);
    if (!videoStats.isFile()) return null;
    return {videoPath, videoStats};
  } catch {
    return null;
  }
}

export async function readScriptText(videosDir, slug) {
  const videoDir = resolveVideoDirectory(videosDir, slug);
  const renderedVideo = await readRenderedVideo(videoDir);
  if (!renderedVideo) return null;
  return readScriptTextFromDirectory(videoDir);
}

export async function readCaptionText(videosDir, slug) {
  const videoDir = resolveVideoDirectory(videosDir, slug);
  const renderedVideo = await readRenderedVideo(videoDir);
  if (!renderedVideo) return null;
  return readCaptionTextFromDirectory(videoDir);
}

export async function getVideoRecord(videosDir, slug) {
  const videoDir = resolveVideoDirectory(videosDir, slug);
  const renderedVideo = await readRenderedVideo(videoDir);
  if (!renderedVideo) return null;

  const spec = await readJson(join(videoDir, 'spec.json'));
  const templateId =
    (typeof spec?.templateId === 'string' && spec.templateId.trim()) ||
    (await readOptionalText(join(videoDir, 'template.txt')));
  const scriptText = await readScriptTextFromDirectory(videoDir);
  const captionText = await readCaptionTextFromDirectory(videoDir);
  const youtubeData = await readJson(join(videoDir, 'youtube.json'));

  return {
    slug,
    title: (typeof spec?.video?.title === 'string' && spec.video.title.trim()) || slug,
    templateId: templateId || null,
    date: (typeof spec?.video?.date === 'string' && spec.video.date.trim()) || null,
    publisher:
      (typeof spec?.source?.publisher === 'string' && spec.source.publisher.trim()) || null,
    videoPath: renderedVideo.videoPath,
    videoSizeBytes: renderedVideo.videoStats.size,
    renderedAt: renderedVideo.videoStats.mtime.toISOString(),
    scriptAvailable: scriptText !== null,
    captionAvailable: captionText !== null,
    youtube: youtubeData && youtubeData.videoId ? {
      videoId: youtubeData.videoId,
      url: youtubeData.url || `https://youtu.be/${youtubeData.videoId}`,
      uploadedAt: youtubeData.uploadedAt || null,
      privacyStatus: youtubeData.privacyStatus || null,
    } : null,
  };
}

export async function scanVideoRecords(videosDir) {
  let entries;
  try {
    entries = await readdir(videosDir, {withFileTypes: true});
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const records = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => getVideoRecord(videosDir, entry.name)),
  );

  return records
    .filter(Boolean)
    .sort((left, right) => right.renderedAt.localeCompare(left.renderedAt));
}
