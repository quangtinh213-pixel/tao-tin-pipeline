#!/usr/bin/env node

/**
 * Find the primary video embedded in an article.
 *
 * Usage:
 *   node scripts/article-video.mjs "<article-url>" "<slug>"
 *
 * Output:
 *   public/<slug>/article-video.json
 *   public/<slug>/article-video.mp4 only when a remote direct URL cannot be used
 */

import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const [rawArticleUrl, slug] = process.argv.slice(2);

if (!rawArticleUrl || !slug) {
  console.error('Usage: node scripts/article-video.mjs "<article-url>" "<slug>"');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  throw new Error('slug may contain only lowercase letters, numbers, and hyphens');
}

const isPrivateIp = (address) => {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const normalized = address.toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('::ffff:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('ff')
  );
};

const assertPublicUrl = async (value) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked URL protocol: ${url.protocol}`);
  }
  const addresses = await dns.lookup(url.hostname, {all: true});
  if (addresses.length === 0 || addresses.some(({address}) => isPrivateIp(address))) {
    throw new Error(`Blocked private or unresolved host: ${url.hostname}`);
  }
  return url;
};

const parseProbe = (stdout) => {
  try {
    const data = JSON.parse(stdout);
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const video = streams.find((stream) => stream.codec_type === 'video');
    const audio = streams.find((stream) => stream.codec_type === 'audio');
    const duration = Number(data.format?.duration);
    if (!video || !Number.isFinite(duration) || duration <= 0) return null;
    return {
      width: Number(video.width) || 0,
      height: Number(video.height) || 0,
      duration,
      hasAudio: Boolean(audio),
    };
  } catch {
    return null;
  }
};

const probe = (src) => {
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'remotion',
      'ffprobe',
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=codec_type,width,height',
      '-of',
      'json',
      src,
    ],
    {cwd: ROOT, encoding: 'utf8', timeout: 45_000},
  );
  return result.status === 0 ? parseProbe(result.stdout) : null;
};

const addJsonLdUrls = (value, urls) => {
  if (Array.isArray(value)) {
    value.forEach((item) => addJsonLdUrls(item, urls));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (
      ['contentUrl', 'embedUrl', 'url'].includes(key) &&
      typeof child === 'string' &&
      /\.(mp4|m4v|webm|mov|m3u8)(?:$|[?#])/i.test(child)
    ) {
      urls.push(child);
    }
    addJsonLdUrls(child, urls);
  }
};

const addNamedEntities = (value, names) => {
  if (Array.isArray(value)) {
    value.forEach((item) => addNamedEntities(item, names));
    return;
  }
  if (typeof value === 'string') {
    const name = value.trim();
    if (name) names.push(name);
    return;
  }
  if (!value || typeof value !== 'object') return;

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const alternateName =
    typeof value.alternateName === 'string' ? value.alternateName.trim() : '';

  if (name && alternateName && !name.includes(alternateName)) {
    names.push(`${name} (${alternateName})`);
  } else if (name) {
    names.push(name);
  } else if (alternateName) {
    names.push(alternateName);
  }
};

const addJsonLdCreators = (value, names) => {
  if (Array.isArray(value)) {
    value.forEach((item) => addJsonLdCreators(item, names));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (['author', 'creator', 'creditText', 'copyrightHolder'].includes(key)) {
      addNamedEntities(child, names);
    }
    addJsonLdCreators(child, names);
  }
};

const cleanCreator = (value) => {
  if (typeof value !== 'string') return null;
  const creator = value.replace(/\s+/g, ' ').trim();
  if (!creator || /^https?:\/\//i.test(creator)) return null;
  return creator;
};

const socialCreatorFromTitle = (title, hostname) => {
  if (!title) return null;

  if (/(^|\.)x\.com$|(^|\.)twitter\.com$/i.test(hostname)) {
    const match = title.match(/^(.+?)\s+\((@[^)]+)\)\s+on\s+X$/i);
    if (match) return `${match[1].trim()} (${match[2].trim()})`;
  }

  return null;
};

const buildAttribution = ({creatorCandidates, publisher, articleTitle, articleUrl}) => {
  const creator =
    socialCreatorFromTitle(articleTitle, articleUrl.hostname) ||
    creatorCandidates.map(cleanCreator).find(Boolean);
  const resolvedPublisher = publisher || articleUrl.hostname;
  const sameSource =
    creator &&
    creator.localeCompare(resolvedPublisher, undefined, {sensitivity: 'base'}) === 0;

  return {
    creator: creator || null,
    publisher: resolvedPublisher,
    sourceCredit:
      creator && !sameSource
        ? `Nguồn: ${creator} · ${resolvedPublisher}`
        : `Nguồn: ${creator || resolvedPublisher}`,
  };
};

const articleUrl = await assertPublicUrl(rawArticleUrl);
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({
  viewport: {width: 1280, height: 900},
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
});
const networkCandidates = [];

await context.route('**/*', async (route) => {
  try {
    await assertPublicUrl(route.request().url());
    await route.continue();
  } catch {
    await route.abort('blockedbyclient');
  }
});

const page = await context.newPage();
page.on('response', (response) => {
  const contentType = response.headers()['content-type'] ?? '';
  const url = response.url();
  if (
    contentType.startsWith('video/') ||
    /application\/(?:vnd\.apple\.mpegurl|x-mpegurl)/i.test(contentType) ||
    /\.(mp4|m4v|webm|mov|m3u8)(?:$|[?#])/i.test(url)
  ) {
    networkCandidates.push(url);
  }
});

try {
  const articleResponse = await page.goto(articleUrl.href, {
    waitUntil: 'domcontentloaded',
    timeout: 35_000,
  });
  const articleContentType = articleResponse?.headers()['content-type'] ?? '';
  if (
    articleContentType.startsWith('video/') ||
    /application\/(?:vnd\.apple\.mpegurl|x-mpegurl)/i.test(articleContentType)
  ) {
    throw new Error(
      'Input must be an article page URL, not a direct video or playlist URL.',
    );
  }
  await page.waitForLoadState('networkidle', {timeout: 8_000}).catch(() => undefined);

  const extracted = await page.evaluate(() => {
    const urls = [];
    const push = (value) => {
      if (!value || value.startsWith('blob:') || value.startsWith('data:')) return;
      try {
        urls.push(new URL(value, document.baseURI).href);
      } catch {
        // Ignore malformed publisher markup.
      }
    };

    document.querySelectorAll('video').forEach((video) => {
      push(video.currentSrc);
      push(video.getAttribute('src'));
      video.querySelectorAll('source').forEach((source) => push(source.getAttribute('src')));
    });

    [
      'meta[property="og:video"]',
      'meta[property="og:video:url"]',
      'meta[property="og:video:secure_url"]',
      'meta[name="twitter:player:stream"]',
    ].forEach((selector) => {
      document.querySelectorAll(selector).forEach((meta) => push(meta.getAttribute('content')));
    });

    const jsonLd = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        jsonLd.push(JSON.parse(script.textContent || 'null'));
      } catch {
        // Ignore invalid JSON-LD.
      }
    });

    const publisher =
      document
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute('content')
        ?.trim() || null;
    const creatorCandidates = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="twitter:creator"]',
      'meta[name="byl"]',
      '[rel="author"]',
      '[itemprop="author"] [itemprop="name"]',
      '[itemprop="creator"] [itemprop="name"]',
    ]
      .flatMap((selector) =>
        [...document.querySelectorAll(selector)].map(
          (element) =>
            element.getAttribute('content') ||
            element.getAttribute('title') ||
            element.textContent ||
            '',
        ),
      )
      .map((value) => value.trim())
      .filter(Boolean);
    const articleTitle =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content')
        ?.trim() ||
      document.title?.trim() ||
      null;

    return {urls, jsonLd, publisher, creatorCandidates, articleTitle};
  });

  const jsonLdCandidates = [];
  addJsonLdUrls(extracted.jsonLd, jsonLdCandidates);
  const jsonLdCreators = [];
  addJsonLdCreators(extracted.jsonLd, jsonLdCreators);
  const attribution = buildAttribution({
    creatorCandidates: [...extracted.creatorCandidates, ...jsonLdCreators],
    publisher: extracted.publisher,
    articleTitle: extracted.articleTitle,
    articleUrl,
  });
  const candidates = [
    ...new Set([
      ...extracted.urls,
      ...jsonLdCandidates.map((candidate) => {
        try {
          return new URL(candidate, articleUrl.href).href;
        } catch {
          return candidate;
        }
      }),
      ...networkCandidates,
    ]),
  ];

  if (candidates.length === 0) {
    throw new Error(
      'No embedded article video was found. Pipeline stopped before TTS/render.',
    );
  }

  let selected = null;
  for (const candidate of candidates) {
    try {
      const safeCandidate = await assertPublicUrl(candidate);
      const metadata = probe(safeCandidate.href);
      if (metadata) {
        selected = {url: safeCandidate.href, metadata};
        break;
      }
    } catch {
      // Try the next candidate.
    }
  }

  const publicDir = path.join(ROOT, 'public', slug);
  fs.mkdirSync(publicDir, {recursive: true});
  let result;

  if (selected) {
    result = {
      articleUrl: articleUrl.href,
      articleTitle: extracted.articleTitle,
      creator: attribution.creator,
      publisher: attribution.publisher,
      sourceCredit: attribution.sourceCredit,
      sourceUrl: selected.url,
      src: selected.url,
      storage: 'remote',
      ...selected.metadata,
    };
  } else {
    let localMetadata = null;
    let sourceUrl = null;
    const outputPath = path.join(publicDir, 'article-video.mp4');

    for (const candidate of candidates) {
      try {
        const safeCandidate = await assertPublicUrl(candidate);
        const response = await context.request.get(safeCandidate.href, {
          headers: {referer: articleUrl.href},
          timeout: 60_000,
        });
        if (!response.ok()) continue;
        await assertPublicUrl(response.url());

        const tempPath = path.join(publicDir, '.article-video-source');
        fs.writeFileSync(tempPath, await response.body());
        const converted = spawnSync(
          process.platform === 'win32' ? 'npx.cmd' : 'npx',
          [
            'remotion',
            'ffmpeg',
            '-y',
            '-i',
            tempPath,
            '-map',
            '0:v:0',
            '-map',
            '0:a:0?',
            '-c:v',
            'libx264',
            '-c:a',
            'aac',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            outputPath,
          ],
          {cwd: ROOT, stdio: 'inherit', timeout: 10 * 60_000},
        );
        fs.rmSync(tempPath, {force: true});
        if (converted.status !== 0) continue;

        localMetadata = probe(outputPath);
        if (localMetadata) {
          sourceUrl = safeCandidate.href;
          break;
        }
      } catch {
        // Try the next candidate.
      }
    }

    if (!localMetadata || !sourceUrl) {
      fs.rmSync(outputPath, {force: true});
      throw new Error(
        'Article video candidates were found, but none could be played or downloaded.',
      );
    }

    result = {
      articleUrl: articleUrl.href,
      articleTitle: extracted.articleTitle,
      creator: attribution.creator,
      publisher: attribution.publisher,
      sourceCredit: attribution.sourceCredit,
      sourceUrl,
      src: `${slug}/article-video.mp4`,
      storage: 'local',
      ...localMetadata,
    };
  }

  fs.writeFileSync(
    path.join(publicDir, 'article-video.json'),
    JSON.stringify(result, null, 2),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await context.close().catch(() => undefined);
  await browser.close();
}
