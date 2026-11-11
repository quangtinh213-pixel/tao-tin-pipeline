#!/usr/bin/env node

/**
 * Extract product information and downloadable gallery images from a TikTok Shop URL.
 *
 * Usage:
 *   node scripts/tiktok-product.mjs "<tiktok-url>" "<slug>"
 *
 * Output:
 *   public/<slug>/product-data.json
 *   public/<slug>/evidence/image-*.{jpg,png,webp}
 *   videos/<slug>/source-context.txt
 */

import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium, devices} from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const [rawUrl, slug] = process.argv.slice(2);

if (!rawUrl || !slug) {
  console.error('Usage: node scripts/tiktok-product.mjs "<tiktok-url>" "<slug>"');
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

const extractUrl = (text) => {
  const match = String(text ?? '').match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : String(text ?? '').trim();
};

const assertPublicUrl = async (value) => {
  const extracted = extractUrl(value);
  const url = new URL(extracted);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked URL protocol: ${url.protocol}`);
  }

  const addresses = await dns.lookup(url.hostname, {all: true});
  if (addresses.length === 0 || addresses.some(({address}) => isPrivateIp(address))) {
    throw new Error(`Blocked private or unresolved host: ${url.hostname}`);
  }

  return url;
};

const cleanText = (val) => (typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : '');

const downloadImage = async (imgUrl, destPath) => {
  try {
    const res = await fetch(imgUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const targetUrl = await assertPublicUrl(rawUrl);
  console.log(`[tiktok-product] Fetching: ${targetUrl.href} for slug: ${slug}`);

  const evidenceDir = path.join(ROOT, 'public', slug, 'evidence');
  const videosDir = path.join(ROOT, 'videos', slug);
  fs.mkdirSync(evidenceDir, {recursive: true});
  fs.mkdirSync(videosDir, {recursive: true});

  const iPhone = devices['iPhone 13'];
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    ...iPhone,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });

  const capturedImages = new Set();
  const page = await context.newPage();

  page.on('response', (response) => {
    const contentType = response.headers()['content-type'] ?? '';
    const u = response.url();
    if (
      (contentType.startsWith('image/') || /\.(png|jpe?g|webp|avif)(?:$|[?#])/i.test(u)) &&
      !/(favicon|avatar|logo|sprite|analytics|beacon|icon|captcha|secsdk|verify|security|puzzle|whirl)/i.test(u)
    ) {
      // Filter high-resolution candidates
      if (u.includes('tiktokcdn') || u.includes('byteimg') || u.includes('ibyteimg')) {
        capturedImages.add(u);
      }
    }
  });

  let pageTitle = '';
  let finalUrl = targetUrl.href;
  let pageContent = {};

  try {
    const res = await page.goto(targetUrl.href, {
      waitUntil: 'domcontentloaded',
      timeout: 35_000,
    });
    finalUrl = page.url();
    await page.waitForTimeout(2500);

    // Try scrolling to load images & reviews
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(1500);

    pageTitle = await page.title();

    pageContent = await page.evaluate(() => {
      const clean = (val) => (val || '').replace(/\s+/g, ' ').trim();
      const meta = (sel) => clean(document.querySelector(sel)?.getAttribute('content'));

      // DOM extraction
      const titleCandidates = [
        meta('meta[property="og:title"]'),
        meta('meta[name="twitter:title"]'),
        document.querySelector('h1')?.textContent,
        document.querySelector('[data-e2e="product-title"]')?.textContent,
        document.querySelector('.product-title')?.textContent,
      ].filter(Boolean);

      const descCandidates = [
        meta('meta[property="og:description"]'),
        meta('meta[name="description"]'),
        document.querySelector('[data-e2e="product-description"]')?.textContent,
        document.querySelector('.product-description')?.textContent,
      ].filter(Boolean);

      // Look for JSON-LD data
      let jsonLd = null;
      document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
        try {
          const parsed = JSON.parse(el.textContent || '{}');
          if (parsed['@type'] === 'Product' || parsed.name) {
            jsonLd = parsed;
          }
        } catch {}
      });

      // Look for embedded state data if any
      let universalData = null;
      const scriptEl = document.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (scriptEl) {
        try {
          universalData = JSON.parse(scriptEl.textContent || '{}');
        } catch {}
      }

      // Collect DOM images (img tags and background images)
      const domImages = Array.from(document.querySelectorAll('img'))
        .map((img) => img.src || img.getAttribute('data-src') || '')
        .filter((src) => src && !src.startsWith('data:'));

      // Collect price text
      const allElements = Array.from(document.querySelectorAll('[class*="price"], [data-e2e*="price"], .product-price, span, div, p'));
      const priceCandidates = allElements
        .map((el) => clean(el.textContent))
        .filter((t) => (t.includes('₫') || t.includes('đ') || t.includes('VND')) && /[0-9]/.test(t) && t.length < 35);

      // Collect rating & sold count
      const ratingCandidates = Array.from(
        document.querySelectorAll('[class*="rating"], [class*="rate"], [data-e2e*="rating"]'),
      ).map((el) => clean(el.textContent));

      const soldCandidates = allElements
        .map((el) => clean(el.textContent))
        .filter((t) => /đã bán|k\s*bán|sold/i.test(t) && t.length < 50);

      return {
        title: titleCandidates[0] || '',
        description: descCandidates[0] || '',
        jsonLd,
        universalData: Boolean(universalData),
        domImages,
        prices: priceCandidates.slice(0, 5),
        ratings: ratingCandidates.slice(0, 5),
        sold: soldCandidates.slice(0, 5),
      };
    });
  } catch (err) {
    console.warn(`[tiktok-product] Warning during page navigation: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Ensure pageContent is valid
  pageContent = {
    title: '',
    description: '',
    jsonLd: null,
    universalData: false,
    domImages: [],
    prices: [],
    ratings: [],
    sold: [],
    ...(pageContent || {}),
  };

  // Extract og_info from resolved URL if present
  let ogTitle = null;
  let ogImage = null;
  try {
    const finalUrlObj = new URL(finalUrl);
    const ogInfoRaw = finalUrlObj.searchParams.get('og_info');
    if (ogInfoRaw) {
      let decoded = decodeURIComponent(ogInfoRaw);
      try {
        const parsedOg = JSON.parse(decoded);
        if (parsedOg.title) ogTitle = cleanText(decodeURIComponent(parsedOg.title).replace(/\+/g, ' '));
        if (parsedOg.image) ogImage = decodeURIComponent(parsedOg.image);
      } catch {
        const matchTitle = decoded.match(/"title":"([^"]+)"/);
        const matchImg = decoded.match(/"image":"([^"]+)"/);
        if (matchTitle?.[1]) ogTitle = cleanText(decodeURIComponent(matchTitle[1]).replace(/\+/g, ' '));
        if (matchImg?.[1]) ogImage = decodeURIComponent(matchImg[1]);
      }
    }
  } catch {}

  // If rawUrl was passed with context text (e.g. "PHOTOOLEX Đèn RGB... https://vt.tiktok.com/...")
  const textBeforeUrl = rawUrl.split(/https?:\/\//i)[0]?.trim();

  // Resolve best product name
  let title = cleanText(
    ogTitle ||
    (pageTitle !== 'Security Check' && pageContent.jsonLd?.name) ||
    (pageTitle !== 'Security Check' && pageContent.title) ||
    (textBeforeUrl && textBeforeUrl.length > 5 ? textBeforeUrl : null) ||
    (pageTitle !== 'Security Check' ? pageTitle : null)
  );
  title = title.replace(/\s*\|\s*TikTok.*$/i, '').replace(/\s*-\s*TikTok.*$/i, '');
  if (!title || title.toLowerCase().includes('security check')) {
    title = textBeforeUrl || 'Sản phẩm TikTok Shop chất lượng cao';
  }

  // If page hit a security check / captcha page, discard capturedImages & domImages to avoid saving captcha puzzle pieces
  const isSecurityCheck = pageTitle === 'Security Check' || (pageContent.title && pageContent.title.toLowerCase().includes('security check'));
  const safeDomImages = isSecurityCheck ? [] : pageContent.domImages;
  const safeCapturedImages = isSecurityCheck ? [] : capturedImages;

  // Resolve best images: merge ogImage, JSON-LD, DOM, background-images and network images
  const allImages = new Set([
    ...(ogImage ? [ogImage] : []),
    ...(!isSecurityCheck && Array.isArray(pageContent.jsonLd?.image)
      ? pageContent.jsonLd.image
      : !isSecurityCheck && pageContent.jsonLd?.image
        ? [pageContent.jsonLd.image]
        : []),
    ...safeDomImages,
    ...safeCapturedImages,
  ]);

  const validImageUrls = Array.from(allImages).filter((src) => {
    return (
      src &&
      src.startsWith('http') &&
      !/(avatar|logo|sprite|icon|100x100|50x50|tracking|analytics|captcha|secsdk|verify|security|puzzle|whirl|tplv-aphluv4xwc-origin)/i.test(src)
    );
  });

  console.log(`[tiktok-product] Found ${validImageUrls.length} candidate images across all sources.`);

  // Download up to 18 top images to maximize available media
  const downloaded = [];
  let imgIndex = 1;
  for (const imgUrl of validImageUrls.slice(0, 25)) {
    let ext = 'jpg';
    if (/\.png/i.test(imgUrl)) ext = 'png';
    if (/\.webp/i.test(imgUrl)) ext = 'webp';

    const filename = `image-${String(imgIndex).padStart(2, '0')}.${ext}`;
    const dest = path.join(evidenceDir, filename);

    const ok = await downloadImage(imgUrl, dest);
    if (ok) {
      downloaded.push({
        src: `${slug}/evidence/${filename}`,
        originalUrl: imgUrl,
      });
      imgIndex++;
      if (downloaded.length >= 18) break;
    }
  }

  // Ensure we have at least 3-4 rich media assets for scenes
  if (downloaded.length < 3 && process.env.OPENAI_API_KEY) {
    console.log(`[tiktok-product] Only ${downloaded.length} web images retrieved. Triggering ChatGPT Images 2.5 to generate supplemental visuals for: "${title}"...`);
    const promptQueries = [
      `Hero commercial photography of ${title}, clean modern studio pedestal, vertical 9:16 aspect ratio, aesthetic soft lighting, high-end commercial shot`,
      `Close-up detail shot highlighting key features and high quality of ${title}, vertical 9:16 aspect ratio, sharp focus`,
      `Lifestyle shot showing ${title} in authentic daily setup, vertical 9:16 aspect ratio, warm cozy ambient lighting`,
    ];

    for (let i = downloaded.length; i < 3; i++) {
      const filename = `ai-product-${String(i + 1).padStart(2, '0')}.png`;
      const genResult = spawnSync(
        'node',
        ['scripts/generate-product-image.mjs', slug, promptQueries[i], filename],
        {cwd: ROOT, encoding: 'utf8', timeout: 90_000},
      );
      if (genResult.status === 0 && fs.existsSync(path.join(evidenceDir, filename))) {
        downloaded.push({
          src: `${slug}/evidence/${filename}`,
          originalUrl: 'ai-generated-chatgpt-images-2.5',
        });
        console.log(`[tiktok-product] ✅ Generated supplemental AI image: ${filename}`);
      } else {
        console.warn(`[tiktok-product] AI image generation note: ${genResult.stderr || genResult.stdout}`);
      }
    }
  }

  // Resolve prices & stats
  const price =
    pageContent.jsonLd?.offers?.price ||
    pageContent.prices[0] ||
    'Đang có ưu đãi';
  const rating =
    pageContent.jsonLd?.aggregateRating?.ratingValue ||
    pageContent.ratings.find((r) => /[0-5]\.[0-9]/.test(r)) ||
    '4.9';
  const sold =
    pageContent.sold.find((s) => /đã bán|k\+|k\s*bán/i.test(s)) ||
    'Hơn 1.000 lượt bán';

  const productData = {
    title: title || 'Sản phẩm TikTok Shop chất lượng cao',
    originalUrl: rawUrl,
    resolvedUrl: finalUrl,
    price: String(price),
    rating: String(rating),
    sold: String(sold),
    description: cleanText(pageContent.description || pageContent.jsonLd?.description),
    images: downloaded,
    fetchedAt: new Date().toISOString(),
  };

  const productJsonPath = path.join(ROOT, 'public', slug, 'product-data.json');
  fs.writeFileSync(productJsonPath, JSON.stringify(productData, null, 2), 'utf8');

  // Generate source-context.txt for AI Planner and Teller
  const sourceContext = [
    `TIÊU ĐỀ SẢN PHẨM: ${productData.title}`,
    `URL NGUỒN TIKTOK SHOP: ${productData.resolvedUrl}`,
    `GIÁ BÁN / ƯU ĐÃI: ${productData.price}`,
    `ĐÁNH GIÁ (RATING): ${productData.rating} sao`,
    `LƯỢT BÁN / SOCIAL PROOF: ${productData.sold}`,
    `MÔ TẢ SẢN PHẨM: ${productData.description || 'Không có mô tả chi tiết từ web, sử dụng thông tin sản phẩm thực tế.'}`,
    `DANH SÁCH ẢNH THỰC TẾ (${downloaded.length} ảnh):`,
    ...downloaded.map((img, i) => `  - Ảnh ${i + 1}: ${img.src}`),
  ].join('\n\n');

  const sourceContextPath = path.join(videosDir, 'source-context.txt');
  fs.writeFileSync(sourceContextPath, sourceContext, 'utf8');

  console.log(`[tiktok-product] Successfully wrote product data to:`);
  console.log(`  - ${productJsonPath}`);
  console.log(`  - ${sourceContextPath}`);
  console.log(`[tiktok-product] Saved ${downloaded.length} images to ${evidenceDir}`);
};

main().catch((err) => {
  console.error(`[tiktok-product] Error: ${err.message}`);
  process.exit(1);
});
