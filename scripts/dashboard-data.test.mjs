import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdtemp, mkdir, rm, utimes, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {
  getVideoRecord,
  readCaptionText,
  readScriptText,
  resolveVideoDirectory,
  scanVideoRecords,
} from './dashboard-data.mjs';

let fixtureRoot;

beforeEach(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'dashboard-data-'));
});

afterEach(async () => {
  await rm(fixtureRoot, {recursive: true, force: true});
});

async function createVideoFixture(
  slug,
  {
    title = 'Rendered story',
    date = '19.09.2026',
    publisher = 'Example News',
    templateId = 'news/media-showcase',
    script,
    caption,
    videoContents = 'video',
    outputMtime,
    specContents,
  } = {},
) {
  const videoRoot = join(fixtureRoot, slug);
  await mkdir(join(videoRoot, 'output'), {recursive: true});
  await writeFile(join(videoRoot, 'output', 'video.mp4'), videoContents);
  await writeFile(join(videoRoot, 'template.txt'), `${templateId}\n`);

  if (specContents !== undefined) {
    await writeFile(join(videoRoot, 'spec.json'), specContents);
  } else {
    await writeFile(
      join(videoRoot, 'spec.json'),
      JSON.stringify({video: {title, date}, source: {publisher}}),
    );
  }

  if (script !== undefined) {
    await mkdir(join(videoRoot, 'script'), {recursive: true});
    await writeFile(join(videoRoot, 'script', 'script.json'), JSON.stringify({script}));
  }

  if (caption !== undefined) {
    await writeFile(join(videoRoot, 'caption.txt'), caption);
  }

  if (outputMtime !== undefined) {
    await utimes(join(videoRoot, 'output', 'video.mp4'), outputMtime, outputMtime);
  }

  return videoRoot;
}

describe('dashboard video artifact data', () => {
  it('lists only rendered artifacts with metadata and newest-first sorting', async () => {
    const olderTime = new Date('2026-09-19T01:00:00.000Z');
    const newerTime = new Date('2026-09-19T02:00:00.000Z');
    await createVideoFixture('older-story', {outputMtime: olderTime});
    const newestRoot = await createVideoFixture('newer-story', {
      title: 'Newer story',
      templateId: 'news/tech-dark',
      publisher: 'Tech News',
      outputMtime: newerTime,
    });
    await mkdir(join(fixtureRoot, 'incomplete-story'), {recursive: true});

    const records = await scanVideoRecords(fixtureRoot);

    expect(records.map((record) => record.slug)).toEqual(['newer-story', 'older-story']);
    expect(records[0]).toMatchObject({
      slug: 'newer-story',
      title: 'Newer story',
      templateId: 'news/tech-dark',
      publisher: 'Tech News',
      videoPath: join(newestRoot, 'output', 'video.mp4'),
      scriptAvailable: false,
      captionAvailable: false,
    });
    expect(records[0].videoSizeBytes).toBeGreaterThan(0);
    expect(records[0].renderedAt).toBe(newerTime.toISOString());
  });

  it('normalizes stored script segments into blank-line-separated text', async () => {
    await createVideoFixture('scripted-story', {
      script: [
        {text: 'Hook'},
        {text: '  Body  '},
        {type: 'ending'},
        {text: ''},
        {text: 'Ending'},
      ],
    });

    await expect(readScriptText(fixtureRoot, 'scripted-story')).resolves.toBe(
      'Hook\n\nBody\n\nEnding',
    );
  });

  it('falls back safely when metadata is malformed and exposes missing scripts', async () => {
    await createVideoFixture('malformed-story', {
      templateId: 'creative/free-style',
      specContents: '{not valid json',
    });
    await createVideoFixture('no-script-story');

    const records = await scanVideoRecords(fixtureRoot);
    const malformed = records.find((record) => record.slug === 'malformed-story');
    const withoutScript = records.find((record) => record.slug === 'no-script-story');

    expect(malformed).toMatchObject({
      title: 'malformed-story',
      templateId: 'creative/free-style',
      publisher: null,
      date: null,
      scriptAvailable: false,
    });
    expect(withoutScript.scriptAvailable).toBe(false);
    await expect(readScriptText(fixtureRoot, 'no-script-story')).resolves.toBeNull();
  });

  it('rejects traversal and non-single-segment slugs before filesystem access', () => {
    expect(() => resolveVideoDirectory(fixtureRoot, '../outside')).toThrow(/invalid slug/i);
    expect(() => resolveVideoDirectory(fixtureRoot, 'nested/story')).toThrow(/invalid slug/i);
    expect(() => resolveVideoDirectory(fixtureRoot, 'nested\\story')).toThrow(/invalid slug/i);
  });

  it('returns null for a missing rendered record', async () => {
    await expect(getVideoRecord(fixtureRoot, 'missing-story')).resolves.toBeNull();
  });

  it('reads caption artifacts safely and exposes availability without previewing text', async () => {
    await createVideoFixture('captioned-story', {caption: '🔴 Caption body\n'});
    await createVideoFixture('no-caption-story');

    const captioned = await getVideoRecord(fixtureRoot, 'captioned-story');
    const withoutCaption = await getVideoRecord(fixtureRoot, 'no-caption-story');

    expect(captioned.captionAvailable).toBe(true);
    await expect(readCaptionText(fixtureRoot, 'captioned-story')).resolves.toBe('🔴 Caption body');
    expect(withoutCaption.captionAvailable).toBe(false);
    await expect(readCaptionText(fixtureRoot, 'no-caption-story')).resolves.toBeNull();
  });
});
