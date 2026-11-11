#!/usr/bin/env node

import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const VIEWPORT = {width: 540, height: 960};
const OUTPUT_SIZE = '1080:1920';

const usage = () => {
  console.error(
    'Usage: node scripts/record-demo.mjs <url> <slug> [--duration 14] [--scroll-distance 1200] [--scroll-duration 3] [--hold-duration 1]',
  );
  process.exit(1);
};

const args = process.argv.slice(2);
if (args.length < 2) usage();

const [rawUrl, slug, ...options] = args;
const getOption = (name, fallback) => {
  const index = options.indexOf(name);
  return index === -1 ? fallback : options[index + 1];
};

const duration = Number(getOption('--duration', '14'));
const scrollDistance = Number(getOption('--scroll-distance', '1200'));
const scrollDuration = Number(getOption('--scroll-duration', '3'));
const holdDuration = Number(getOption('--hold-duration', '1'));

if (!Number.isFinite(duration) || duration < 4 || duration > 30) {
  throw new Error('--duration must be between 4 and 30 seconds');
}
if (!Number.isFinite(scrollDistance) || scrollDistance < 100 || scrollDistance > 5000) {
  throw new Error('--scroll-distance must be between 100 and 5000 pixels');
}
if (!Number.isFinite(scrollDuration) || scrollDuration < 0.5) {
  throw new Error('--scroll-duration must be at least 0.5 seconds');
}
if (!Number.isFinite(holdDuration) || holdDuration < 0) {
  throw new Error('--hold-duration must be zero or greater');
}
if (scrollDuration + holdDuration > duration) {
  throw new Error('One scroll phase plus hold-duration must fit within --duration');
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
      (a === 198 && b >= 18 && b <= 19) ||
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const smoothScrollTo = async (page, targetY, durationMs) => {
  await page.evaluate(
    ({targetY, durationMs}) =>
      new Promise((resolve) => {
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startedAt = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - startedAt) / durationMs, 1);
          const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
          window.scrollTo(0, startY + distance * eased);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve(undefined);
        };
        requestAnimationFrame(tick);
      }),
    {targetY, durationMs},
  );
};

const targetUrl = await assertPublicUrl(rawUrl);
const publicDir = path.join(ROOT, 'public', slug);
const rawDir = path.join(publicDir, '.demo-recording');
const outputPath = path.join(publicDir, 'demo.mp4');
fs.mkdirSync(rawDir, {recursive: true});

const browser = await chromium.launch({headless: true});
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  recordVideo: {dir: rawDir, size: VIEWPORT},
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
const recordingStartedAt = Date.now();
page.on('dialog', (dialog) => dialog.dismiss());

try {
  await page.goto(targetUrl.href, {waitUntil: 'domcontentloaded', timeout: 30_000});
  await page.waitForLoadState('networkidle', {timeout: 8_000}).catch(() => undefined);
  await sleep(750);

  const totalMs = duration * 1000;
  const scrollMs = scrollDuration * 1000;
  const holdMs = holdDuration * 1000;
  const cycleMs = scrollMs + holdMs;
  const cycleCount = Math.floor(totalMs / cycleMs);
  const finalHoldMs = totalMs - cycleCount * cycleMs;

  const actionStartedAt = Date.now();
  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    const target = await page.evaluate(
      (distance) =>
        Math.max(
          0,
          Math.min(window.scrollY + distance, document.documentElement.scrollHeight - innerHeight),
        ),
      scrollDistance,
    );
    await smoothScrollTo(page, target, scrollMs);
    await sleep(holdMs);
  }
  await sleep(finalHoldMs + 500);

  const trimStart = (actionStartedAt - recordingStartedAt) / 1000;
  const video = page.video();
  await context.close();
  const rawPath = await video.path();

  const ffmpeg = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'remotion',
      'ffmpeg',
      '-y',
      '-ss',
      trimStart.toFixed(3),
      '-i',
      rawPath,
      '-t',
      String(duration),
      '-an',
      '-vf',
      `scale=${OUTPUT_SIZE}:flags=lanczos`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      outputPath,
    ],
    {cwd: ROOT, stdio: 'inherit'},
  );
  if (ffmpeg.status !== 0) throw new Error(`ffmpeg exited with code ${ffmpeg.status}`);
  fs.rmSync(rawDir, {recursive: true, force: true});

  fs.writeFileSync(
    path.join(publicDir, 'demo.json'),
    JSON.stringify(
      {
        url: targetUrl.href,
        src: `${slug}/demo.mp4`,
        duration,
        width: 1080,
        height: 1920,
        muted: true,
        scrollDistance,
        scrollDuration,
        holdDuration,
        cycleCount,
      },
      null,
      2,
    ),
  );
  console.log(`Demo recorded: public/${slug}/demo.mp4`);
} finally {
  await context.close().catch(() => undefined);
  await browser.close();
}
