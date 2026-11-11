#!/usr/bin/env node
/**
 * Screenshot source articles with the exact quoted sentence located for a highlight sweep.
 *
 * Usage: node scripts/capture-evidence.mjs "<slug>" "<shots.json>"
 *   shots.json: [{"id": "ev-01", "url": "https://...", "quote": "verbatim sentence from source-context.txt"}]
 * Writes public/<slug>/evidence-shots/<id>.png and public/<slug>/evidence-shots/shots.json:
 *   [{id, src, url, width, height, found, rects: [{x,y,w,h}], focus: {x,y,w,h}}]
 * When the quote is not found, the shot falls back to the headline area with no rects (found: false).
 */
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {assertPublicUrl} from './source-evidence-helpers.mjs';

const VIEWPORT = {width: 1600, height: 900};
// Overlays that cover article text in screenshots.
const HIDE_CSS = `
  html, body { scroll-behavior: auto !important; }
  iframe, ins, [id*="cookie" i], [class*="cookie" i], [class*="consent" i], [id*="consent" i],
  [class*="popup" i], [id*="popup" i], [class*="banner" i]:not(img), [class*="sticky" i], [class*="advert" i],
  [id*="advert" i], [class*="ads-" i], [class*="-ads" i], [id^="ads" i], [class*="modal" i] { display: none !important; }
`;

async function openArticle(page, url) {
  await page.goto((await assertPublicUrl(url)).href, {waitUntil: 'domcontentloaded', timeout: 60_000});
  await page.waitForLoadState('networkidle', {timeout: 8_000}).catch(() => undefined);
  await page.addStyleTag({content: HIDE_CSS});
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') el.style.setProperty('display', 'none', 'important');
    }
  });
}

async function captureShot(page, shot, outDir, slug) {
  // Several quotes usually come from one article: reuse the loaded page.
  if (page.url() !== shot.url) await openArticle(page, shot.url);
  await page.evaluate(() => document.fonts.ready);

  const geometry = await page.evaluate(async (quote) => {
    const toBox = (r) => ({x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)});
    const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 300)));
    const target = quote.replace(/\s+/gu, ' ').trim();
    // Normalized page text, each character mapped back to its text node + offset.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    const map = [];
    let text = '';
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement || node.parentElement.closest('script,style,noscript')) continue;
      const raw = node.textContent;
      for (let i = 0; i < raw.length; i += 1) {
        const ch = /\s/u.test(raw[i]) ? ' ' : raw[i];
        if (ch === ' ' && text.endsWith(' ')) continue;
        text += ch;
        map.push([nodes.length, i]);
      }
      nodes.push(node);
    }
    const at = target ? text.indexOf(target) : -1;
    if (at < 0) {
      const h1 = document.querySelector('h1');
      window.scrollTo(0, h1 ? h1.getBoundingClientRect().top + window.scrollY - 120 : 0);
      await nextFrame();
      const focus = h1 ? h1.getBoundingClientRect() : {left: 0, top: 0, width: window.innerWidth, height: window.innerHeight};
      return {found: false, rects: [], focus: toBox(focus)};
    }
    const [sn, so] = map[at];
    const [en, eo] = map[at + target.length - 1];
    const range = document.createRange();
    range.setStart(nodes[sn], so);
    range.setEnd(nodes[en], eo + 1);
    window.scrollBy(0, range.getBoundingClientRect().top - window.innerHeight * 0.45);
    await nextFrame();
    // Inline tags split a line into fragments: merge them into one box per visual line.
    const lines = [];
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
      if (line) {
        line.left = Math.min(line.left, r.left);
        line.right = Math.max(line.right, r.right);
        line.bottom = Math.max(line.bottom, r.bottom);
      } else lines.push({left: r.left, right: r.right, top: r.top, bottom: r.bottom});
    }
    lines.sort((x, y) => x.top - y.top);
    const rects = lines.map((l) => toBox({left: l.left, top: l.top, width: l.right - l.left, height: l.bottom - l.top}));
    return {found: rects.length > 0, rects, focus: toBox(range.getBoundingClientRect())};
  }, shot.quote);

  const file = path.join(outDir, `${shot.id}.png`);
  await page.screenshot({path: file, clip: {x: 0, y: 0, ...VIEWPORT}});
  return {
    id: shot.id,
    src: `${slug}/evidence-shots/${shot.id}.png`,
    url: shot.url,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    ...geometry,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [slug, shotsPath] = process.argv.slice(2);
  if (!slug || !shotsPath || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/capture-evidence.mjs "<slug>" "<shots.json>"');
    process.exit(1);
  }
  const shots = JSON.parse(fs.readFileSync(shotsPath, 'utf8'));
  const outDir = path.join('public', slug, 'evidence-shots');
  fs.mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });
  await context.route('**/*', async (route) => {
    try {
      await assertPublicUrl(route.request().url());
      await route.continue();
    } catch {
      await route.abort('blockedbyclient');
    }
  });
  const page = await context.newPage();
  const results = [];
  try {
    for (const shot of shots) {
      try {
        const result = await captureShot(page, shot, outDir, slug);
        console.log(`${shot.id}: ${result.found ? `highlight ${result.rects.length} lines` : 'quote not found → headline fallback'}`);
        results.push(result);
      } catch (error) {
        // One slow or blocked page must not lose the other shots; the spec simply cannot use this id.
        console.error(`${shot.id}: FAILED (${error.message.split('\n')[0]})`);
        await page.goto('about:blank').catch(() => undefined);
      }
    }
  } finally {
    await browser.close();
  }
  // Merge by id so failed shots can be re-run alone without losing earlier ones.
  const indexPath = path.join(outDir, 'shots.json');
  const previous = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : [];
  const merged = [...previous.filter((p) => !results.some((r) => r.id === p.id)), ...results];
  fs.writeFileSync(indexPath, `${JSON.stringify(merged, null, 2)}\n`);
}
