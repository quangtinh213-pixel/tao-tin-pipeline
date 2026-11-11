#!/usr/bin/env node

/**
 * Extract article context and reusable image/video evidence from a public URL.
 *
 * Usage:
 *   node scripts/source-evidence.mjs "<article-url>" "<slug>"
 *
 * Output:
 *   public/<slug>/source-evidence.json
 *   public/<slug>/evidence/image-*.{jpg,png,webp}
 *   videos/<slug>/source-context.txt
 */

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {
  expandImageCandidates,
  expandVideoCandidates,
  prepareMediaCandidates,
  prioritizeMediaCandidates,
  assertPublicUrl,
} from './source-evidence-helpers.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const [rawArticleUrl, slug] = process.argv.slice(2);
const MAX_ARTICLE_CHARS = 40_000;

if (!rawArticleUrl || !slug) {
  console.error('Usage: node scripts/source-evidence.mjs "<article-url>" "<slug>"');
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  throw new Error('slug may contain only lowercase letters, numbers, and hyphens');
}

const normalizeText = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const parseProbe = (stdout) => {
  try {
    const data = JSON.parse(stdout);
    const streams = Array.isArray(data.streams) ? data.streams : [];
    const video = streams.find((stream) => stream.codec_type === 'video');
    const duration = Number(data.format?.duration);
    if (!video || !Number.isFinite(duration) || duration <= 0) return null;

    return {
      width: Number(video.width) || 0,
      height: Number(video.height) || 0,
      duration,
    };
  } catch {
    return null;
  }
};

const probeVideo = (src) => {
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

const extensionFromContentType = (contentType, sourceUrl = '') => {
  if (/image\/png/i.test(contentType)) return 'png';
  if (/image\/webp/i.test(contentType)) return 'webp';
  if (/image\/jpe?g/i.test(contentType)) return 'jpg';
  if (/image\/avif/i.test(contentType)) return 'avif';
  const extension = sourceUrl.match(/\.(png|jpe?g|webp|avif)(?:$|[?#])/i)?.[1];
  if (extension) return extension.toLowerCase().replace('jpeg', 'jpg');
  return null;
};

const socialCreatorFromTitle = (title, hostname) => {
  if (!title) return null;
  if (/(^|\.)x\.com$|(^|\.)twitter\.com$/i.test(hostname)) {
    const match = title.match(/^(.+?)\s+\((@[^)]+)\)\s+on\s+X$/i);
    if (match) return `${match[1].trim()} (${match[2].trim()})`;
  }
  return null;
};

const buildAttribution = ({creatorCandidates, publisher, title, articleUrl}) => {
  const creator =
    socialCreatorFromTitle(title, articleUrl.hostname) ||
    creatorCandidates.map(normalizeText).find(Boolean) ||
    null;
  const resolvedPublisher = normalizeText(publisher) || articleUrl.hostname;
  const sameSource =
    creator &&
    creator.localeCompare(resolvedPublisher, undefined, {sensitivity: 'base'}) === 0;

  return {
    creator,
    publisher: resolvedPublisher,
    credit:
      creator && !sameSource
        ? `Nguồn: ${creator} · ${resolvedPublisher}`
        : `Nguồn: ${creator || resolvedPublisher}`,
  };
};

const articleUrl = await assertPublicUrl(rawArticleUrl);
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({
  viewport: {width: 1440, height: 1000},
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
});
const networkVideos = [];
const networkImages = [];

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
    networkVideos.push(url);
  }
  if (
    contentType.startsWith('image/') ||
    /\.(png|jpe?g|webp|avif)(?:$|[?#])/i.test(url)
  ) {
    networkImages.push(url);
  }
});

try {
  const response = await page.goto(articleUrl.href, {
    waitUntil: 'domcontentloaded',
    timeout: 35_000,
  });
  const articleContentType = response?.headers()['content-type'] ?? '';
  if (!articleContentType.includes('text/html')) {
    throw new Error('Input must be a public HTML article/page URL.');
  }

  await page.waitForLoadState('networkidle', {timeout: 8_000}).catch(() => undefined);
  await page.evaluate(() => window.scrollTo(0, Math.min(document.body.scrollHeight, 5000)));
  await page.waitForTimeout(1200);

  const extracted = await page.evaluate((maxArticleChars) => {
    const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const absolute = (value) => {
      if (!value || value.startsWith('data:') || value.startsWith('blob:')) return null;
      try {
        return new URL(value, document.baseURI).href;
      } catch {
        return null;
      }
    };
    const textOf = (selector) => clean(document.querySelector(selector)?.textContent);
    const meta = (selector) =>
      clean(document.querySelector(selector)?.getAttribute('content'));
    const closestText = (element) => {
      const container = element.closest('figure, article, section, p, div');
      return clean(container?.textContent).slice(0, 700);
    };
    const figureCaption = (element) =>
      clean(element.closest('figure')?.querySelector('figcaption')?.textContent);

    const candidateRoots = [
      ...document.querySelectorAll(
        '[itemprop="articleBody"], .article__body, .content-col, .main-col, .details__content, .detail__content, .article-content, .article__content, .content-detail, .fck_detail, main, [role="main"], article',
      ),
    ];
    let articleRoot = document.body;
    let maxParagraphLen = 0;
    for (const el of candidateRoots) {
      const pLen = [...el.querySelectorAll('p')].reduce(
        (sum, p) => sum + clean(p.textContent).length,
        0,
      );
      if (pLen > maxParagraphLen) {
        maxParagraphLen = pLen;
        articleRoot = el;
      }
    }
    const paragraphs = [...articleRoot.querySelectorAll('p')]
      .map((paragraph) => clean(paragraph.textContent))
      .filter((paragraph) => paragraph.length >= 30);
    const articleText = paragraphs.join('\n\n').slice(0, maxArticleChars);

    const lazyImageAttributes = [
      'data-large-src',
      'data-src',
      'data-lazy-src',
      'data-original',
      'data-image',
      'data-url',
      'data-fallback-src',
    ];
    const imageSrcsetAttributes = ['srcset', 'data-srcset', 'data-lazy-srcset'];

    const rootImgs = [...articleRoot.querySelectorAll('img')];
    const heroImgs = [
      ...document.querySelectorAll(
        'figure.article__avatar img, .article__avatar img, img.cms-photo',
      ),
    ];
    const targetImgs = [...new Set([...heroImgs, ...rootImgs])];

    const images = targetImgs.map((image) => {
      const parseDim = (val) => {
        const n = parseInt(val, 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
      };
      const parsedWidth =
        parseDim(image.getAttribute('data-width')) ||
        parseDim(image.getAttribute('width')) ||
        parseDim(image.width);
      const parsedHeight =
        parseDim(image.getAttribute('data-height')) ||
        parseDim(image.getAttribute('height')) ||
        parseDim(image.height);
      const naturalWidth = image.naturalWidth > 10 ? image.naturalWidth : 0;
      const naturalHeight = image.naturalHeight > 10 ? image.naturalHeight : 0;
      const width = naturalWidth || parsedWidth || 0;
      const height = naturalHeight || parsedHeight || 0;

      return {
        currentSrc: image.currentSrc,
        src: image.getAttribute('src'),
        srcset:
          imageSrcsetAttributes
            .map((attribute) => image.getAttribute(attribute))
            .find(Boolean) || '',
        pictureSrcsets: [
          ...((image.closest('picture')?.querySelectorAll('source') || [])),
        ]
          .map((source) =>
            imageSrcsetAttributes
              .map((attribute) => source.getAttribute(attribute))
              .find(Boolean),
          )
          .filter(Boolean),
        lazySources: lazyImageAttributes
          .map((attribute) => image.getAttribute(attribute))
          .filter(Boolean),
        width,
        height,
        alt: clean(image.getAttribute('alt') || image.getAttribute('title')),
        className: image.getAttribute('class'),
        id: image.getAttribute('id'),
        caption: figureCaption(image) || clean(image.getAttribute('title')),
        nearbyText: closestText(image),
      };
    });

    const rootVideos = [...articleRoot.querySelectorAll('video')];
    const heroVideos = [
      ...document.querySelectorAll(
        'figure.article__avatar video, .article__avatar video, video.cms-video',
      ),
    ];
    const targetVideos = [...new Set([...heroVideos, ...rootVideos])];

    const videos = targetVideos.map((video) => ({
      src: video.currentSrc || video.getAttribute('src'),
      sources: [
        video.getAttribute('src'),
        video.getAttribute('data-src'),
        video.getAttribute('data-video-src'),
        ...[...video.querySelectorAll('source')].map((source) =>
          source.getAttribute('src') ||
          source.getAttribute('data-src') ||
          source.getAttribute('data-video-src'),
        ),
      ].filter(Boolean),
      poster: absolute(video.getAttribute('poster')),
      caption: figureCaption(video),
      nearbyText: closestText(video),
      className: video.getAttribute('class'),
      id: video.getAttribute('id'),
    }));

    const metadataVideos = [
      'meta[property="og:video"]',
      'meta[property="og:video:url"]',
      'meta[property="og:video:secure_url"]',
      'meta[name="twitter:player:stream"]',
    ]
      .flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element) =>
          absolute(element.getAttribute('content')),
        ),
      )
      .filter(Boolean)
      .map((src) => ({src, poster: null, caption: '', nearbyText: ''}));

    const metadataImages = [
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[property="og:image:secure_url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    ]
      .flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element) =>
          element.getAttribute('content'),
        ),
      )
      .filter(Boolean)
      .map((src) => ({src, alt: '', caption: '', nearbyText: ''}));

    const jsonLdImages = [];
    const jsonLdVideos = [];
    const addJsonLdValues = (target, value) => {
      if (typeof value === 'string') {
        target.push({src: value, poster: null, caption: '', nearbyText: ''});
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => addJsonLdValues(target, entry));
        return;
      }
      if (!value || typeof value !== 'object') return;
      [value.contentUrl, value.url, value.embedUrl]
        .filter(Boolean)
        .forEach((src) =>
          target.push({src, poster: null, caption: '', nearbyText: ''}),
        );
      if (value.encoding) addJsonLdValues(target, value.encoding);
    };
    const jsonLdNodes = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((script) => {
        try {
          return [JSON.parse(script.textContent || 'null')];
        } catch {
          return [];
        }
      });
    const walkJsonLd = (value) => {
      if (Array.isArray(value)) {
        value.forEach(walkJsonLd);
        return;
      }
      if (!value || typeof value !== 'object') return;

      const types = [value['@type']]
        .flatMap((type) => (Array.isArray(type) ? type : [type]))
        .filter(Boolean)
        .map((type) => String(type));
      if (types.some((type) => /videoobject/i.test(type))) {
        addJsonLdValues(jsonLdVideos, value.contentUrl || value.url || value.embedUrl);
        addJsonLdValues(jsonLdImages, value.thumbnailUrl);
      }
      if (types.some((type) => /imageobject/i.test(type))) {
        addJsonLdValues(jsonLdImages, value.contentUrl || value.url);
      }
      if (types.some((type) => /article|newsarticle|reportagenewsarticle/i.test(type))) {
        addJsonLdValues(jsonLdImages, value.image);
      }

      Object.values(value).forEach((child) => {
        if (child !== value) walkJsonLd(child);
      });
    };
    jsonLdNodes.forEach(walkJsonLd);

    const creatorCandidates = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="twitter:creator"]',
      '[rel="author"]',
      '[itemprop="author"] [itemprop="name"]',
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
      .map(clean)
      .filter(Boolean);

    return {
      title: meta('meta[property="og:title"]') || clean(document.title),
      description:
        meta('meta[property="og:description"]') ||
        meta('meta[name="description"]') ||
        '',
      publishedAt:
        meta('meta[property="article:published_time"]') ||
        document.querySelector('time')?.getAttribute('datetime') ||
        '',
      publisher: meta('meta[property="og:site_name"]'),
      creatorCandidates,
      articleText: articleText || textOf('body').slice(0, maxArticleChars),
      images,
      metadataImages: [...metadataImages, ...jsonLdImages],
      videos,
      metadataVideos: [...metadataVideos, ...jsonLdVideos],
    };
  }, MAX_ARTICLE_CHARS);

  const attribution = buildAttribution({
    creatorCandidates: extracted.creatorCandidates,
    publisher: extracted.publisher,
    title: extracted.title,
    articleUrl,
  });
  const publicDir = path.join(ROOT, 'public', slug);
  const evidenceDir = path.join(publicDir, 'evidence');
  fs.mkdirSync(evidenceDir, {recursive: true});

  const prioritizedMedia = prioritizeMediaCandidates({
    videos: expandVideoCandidates({
      baseUrl: articleUrl.href,
      embeddedVideos: extracted.videos,
      metadataVideos: extracted.metadataVideos,
      networkVideos: networkVideos.map((src) => ({src})),
    }),
    images: expandImageCandidates({
      baseUrl: articleUrl.href,
      domImages: extracted.images,
      metadataImages: extracted.metadataImages,
      networkImages: networkImages.map((src) => ({src})),
    }),
  });

  const acquisitionCandidates = prepareMediaCandidates({
    videos: prioritizedMedia.videos,
    images: prioritizedMedia.images,
  });

  const videos = [];

  for (const candidate of acquisitionCandidates.videos) {
    try {
      const safeUrl = await assertPublicUrl(candidate.src);
      const metadata = probeVideo(safeUrl.href);
      if (!metadata) continue;

      videos.push({
        id: `video-${String(videos.length + 1).padStart(2, '0')}`,
        kind: 'video',
        src: safeUrl.href,
        storage: 'remote',
        sourcePageUrl: articleUrl.href,
        sourceMediaUrl: safeUrl.href,
        credit: attribution.credit,
        caption: normalizeText(candidate.caption) || null,
        alt: null,
        nearbyText: normalizeText(candidate.nearbyText) || null,
        poster: candidate.poster || null,
        ...metadata,
      });
    } catch {
      // Skip blocked, inaccessible, or unsupported videos.
    }
  }

  const imageCandidates = acquisitionCandidates.images;
  const images = [];

  for (const candidate of imageCandidates) {
    try {
      const safeUrl = await assertPublicUrl(candidate.src);
      const imageResponse = await context.request.get(safeUrl.href, {
        headers: {referer: articleUrl.href},
        timeout: 30_000,
      });
      if (!imageResponse.ok()) continue;
      await assertPublicUrl(imageResponse.url());

      const extension = extensionFromContentType(
        imageResponse.headers()['content-type'] ?? '',
        imageResponse.url(),
      );
      if (!extension) continue;

      const filename = `image-${String(images.length + 1).padStart(2, '0')}.${extension}`;
      const outputPath = path.join(evidenceDir, filename);
      fs.writeFileSync(outputPath, await imageResponse.body());

      images.push({
        id: `image-${String(images.length + 1).padStart(2, '0')}`,
        kind: 'image',
        src: `${slug}/evidence/${filename}`,
        storage: 'local',
        sourcePageUrl: articleUrl.href,
        sourceMediaUrl: safeUrl.href,
        credit: attribution.credit,
        caption: normalizeText(candidate.caption) || null,
        alt: normalizeText(candidate.alt) || null,
        nearbyText: normalizeText(candidate.nearbyText) || null,
        width: candidate.width,
        height: candidate.height,
      });
    } catch {
      // Skip blocked, inaccessible, or unsupported images.
    }
  }

  const result = {
    version: 1,
    article: {
      url: articleUrl.href,
      title: normalizeText(extracted.title) || null,
      description: normalizeText(extracted.description) || null,
      publishedAt: normalizeText(extracted.publishedAt) || null,
      creator: attribution.creator,
      publisher: attribution.publisher,
      credit: attribution.credit,
      text: extracted.articleText.trim(),
    },
    assets: [...videos, ...images],
    stats: {
      imageCount: images.length,
      videoCount: videos.length,
      usableAssetCount: images.length + videos.length,
    },
  };

  fs.writeFileSync(
    path.join(publicDir, 'source-evidence.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  const sourceContextPath = path.join(ROOT, 'videos', slug, 'source-context.txt');
  fs.mkdirSync(path.dirname(sourceContextPath), {recursive: true});
  fs.writeFileSync(
    sourceContextPath,
    [
      extracted.title,
      extracted.description,
      `URL: ${articleUrl.href}`,
      `Nguồn: ${attribution.credit.replace(/^Nguồn:\s*/i, '')}`,
      extracted.articleText,
    ]
      .filter(Boolean)
      .join('\n\n'),
  );

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await context.close().catch(() => undefined);
  await browser.close();
}
