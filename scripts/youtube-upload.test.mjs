import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  formatYouTubeTitle,
  extractTagsFromCaption,
  formatYouTubeDescription,
  isAlreadyUploaded,
  recordUploadResult,
  findEligibleVideos,
  findLatestVideo,
  nextPublishSlot,
  takenPublishTimes,
  formatYouTubeChapters,
  timelineToSrt,
  isLongFormSpec,
} from './youtube-upload.mjs';

describe('publish slot scheduling', () => {
  const at = (iso) => Date.parse(iso);

  it('picks the next golden slot today in Vietnam time', () => {
    const slot = nextPublishSlot([], {now: new Date('2026-11-01T10:00:00+07:00')});
    expect(slot.toISOString()).toBe(new Date('2026-11-01T11:30:00+07:00').toISOString());
  });

  it('skips slots within the gap of a taken time and keeps a 15 minute lead', () => {
    const taken = [at('2026-11-01T11:30:00+07:00'), at('2026-11-01T12:00:00+07:00')];
    const slot = nextPublishSlot(taken, {now: new Date('2026-11-01T11:20:00+07:00')});
    expect(slot.toISOString()).toBe(new Date('2026-11-01T13:00:00+07:00').toISOString());
  });

  it('spreads a batch of five one hour apart and rolls over to the next day', () => {
    const taken = [];
    const now = new Date('2026-11-01T20:00:00+07:00');
    for (let i = 0; i < 5; i += 1) taken.push(nextPublishSlot(taken, {now}).getTime());
    expect(taken.map((t) => new Date(t).toISOString())).toEqual([
      '2026-11-01T14:00:00.000Z', // 21:00 VN
      '2026-11-01T15:00:00.000Z', // 22:00
      '2026-11-02T00:00:00.000Z', // 07:00 next day
      '2026-11-02T04:30:00.000Z', // 11:30
      '2026-11-02T05:30:00.000Z', // 12:30
    ]);
  });

  it('honours a custom gap', () => {
    const taken = [at('2026-11-01T18:00:00+07:00')];
    const slot = nextPublishSlot(taken, {now: new Date('2026-11-01T17:00:00+07:00'), gapMinutes: 30});
    expect(slot.toISOString()).toBe(new Date('2026-11-01T18:30:00+07:00').toISOString());
  });

  it('rejects malformed slot strings', () => {
    expect(() => nextPublishSlot([], {slots: '11h30'})).toThrow(/không hợp lệ/);
  });

  it('reads scheduled and public-now times from youtube.json, ignoring private uploads', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-slots-'));
    const write = (slug, data) => {
      fs.mkdirSync(path.join(dir, slug));
      fs.writeFileSync(path.join(dir, slug, 'youtube.json'), JSON.stringify(data));
    };
    write('a', {privacyStatus: 'private', publishAt: '2026-11-01T11:00:00.000Z'});
    write('b', {privacyStatus: 'public', uploadedAt: '2026-11-01T05:00:00.000Z'});
    write('c', {privacyStatus: 'private', uploadedAt: '2026-11-01T06:00:00.000Z'});
    expect(takenPublishTimes(dir).sort()).toEqual([at('2026-11-01T05:00:00.000Z'), at('2026-11-01T11:00:00.000Z')]);
    fs.rmSync(dir, {recursive: true, force: true});
  });
});

describe('YouTube Upload Helper Utilities', () => {
  describe('formatYouTubeTitle', () => {
    it('appends #Shorts for short titles by default', () => {
      const result = formatYouTubeTitle('Phát hiện 71 bộ hài cốt liệt sĩ ở Ngũ Hiệp');
      expect(result).toBe('Phát hiện 71 bộ hài cốt liệt sĩ ở Ngũ Hiệp #Shorts');
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it('does not duplicate #Shorts if already present', () => {
      const result = formatYouTubeTitle('Tin nóng trong ngày #Shorts');
      expect(result).toBe('Tin nóng trong ngày #Shorts');
    });

    it('truncates titles exceeding 100 characters and preserves #Shorts', () => {
      const longTitle = 'A'.repeat(120);
      const result = formatYouTubeTitle(longTitle, {isShorts: true});
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.endsWith('... #Shorts')).toBe(true);
    });

    it('handles titles without #Shorts when isShorts is false', () => {
      const result = formatYouTubeTitle('Video bản tin dài 16:9', {isShorts: false});
      expect(result).toBe('Video bản tin dài 16:9');
    });
  });

  describe('extractTagsFromCaption', () => {
    it('extracts hashtags from caption text and merges defaults', () => {
      const caption = '🔴 NÓNG: Tin tức hôm nay.\n\n#VnNews213 #tintuc #xahoi #phapluat';
      const tags = extractTagsFromCaption(caption, ['VnNews213', 'VNNews', 'Shorts']);

      expect(tags).toContain('VnNews213');
      expect(tags).toContain('tintuc');
      expect(tags).toContain('xahoi');
      expect(tags).toContain('phapluat');
      expect(tags).toContain('VNNews');
      expect(tags).toContain('Shorts');

      // No hashtag symbol '#' in the tags
      tags.forEach((tag) => expect(tag.startsWith('#')).toBe(false));
    });

    it('deduplicates tags', () => {
      const caption = '#tintuc #tintuc #VnNews213';
      const tags = extractTagsFromCaption(caption, ['tintuc', 'VnNews213']);
      const countTinTuc = tags.filter((t) => t === 'tintuc').length;
      expect(countTinTuc).toBe(1);
    });
  });

  describe('formatYouTubeDescription', () => {
    it('returns caption text and appends source URL if provided', () => {
      const caption = 'Nội dung tin tức mới nhất.\n\n#VnNews213';
      const sourceUrl = 'https://tuoitre.vn/tin-tuc-123.htm';
      const description = formatYouTubeDescription(caption, sourceUrl);

      expect(description).toContain('Nội dung tin tức mới nhất.');
      expect(description).toContain('📌 Nguồn tin: https://tuoitre.vn/tin-tuc-123.htm');
    });

    it('does not duplicate source URL if already in caption', () => {
      const sourceUrl = 'https://tuoitre.vn/tin-tuc-123.htm';
      const caption = `Nội dung tin tức tại ${sourceUrl}\n\n#VnNews213`;
      const description = formatYouTubeDescription(caption, sourceUrl);

      const occurrences = description.split(sourceUrl).length - 1;
      expect(occurrences).toBe(1);
    });
  });

  describe('Upload deduplication and scanning with temporary directory', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-upload-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, {recursive: true, force: true});
    });

    it('checks if video is already uploaded via youtube.json', () => {
      const slug = 'test-video-1';
      const slugDir = path.join(tempDir, slug);
      fs.mkdirSync(slugDir, {recursive: true});

      expect(isAlreadyUploaded(slug, tempDir)).toBe(false);

      recordUploadResult(
        slug,
        {
          videoId: 'abc12345',
          url: 'https://youtu.be/abc12345',
          title: 'Test Video',
        },
        tempDir
      );

      expect(isAlreadyUploaded(slug, tempDir)).toBe(true);
    });

    it('finds eligible videos for upload and ignores already uploaded ones unless forced', () => {
      // Create video 1 (rendered, not uploaded)
      const slug1 = 'slug-one';
      const dir1 = path.join(tempDir, slug1, 'output');
      fs.mkdirSync(dir1, {recursive: true});
      fs.writeFileSync(path.join(dir1, 'video.mp4'), 'mock-video-content-1');

      // Create video 2 (rendered and uploaded)
      const slug2 = 'slug-two';
      const dir2 = path.join(tempDir, slug2, 'output');
      fs.mkdirSync(dir2, {recursive: true});
      fs.writeFileSync(path.join(dir2, 'video.mp4'), 'mock-video-content-2');
      fs.writeFileSync(
        path.join(tempDir, slug2, 'youtube.json'),
        JSON.stringify({videoId: 'xyz987', url: 'https://youtu.be/xyz987'})
      );

      // Create video 3 (no output/video.mp4)
      const slug3 = 'slug-three';
      fs.mkdirSync(path.join(tempDir, slug3), {recursive: true});

      const eligible = findEligibleVideos(tempDir);
      expect(eligible.map((e) => e.slug)).toEqual(['slug-one']);

      const eligibleForced = findEligibleVideos(tempDir, {force: true});
      expect(eligibleForced.map((e) => e.slug)).toContain('slug-one');
      expect(eligibleForced.map((e) => e.slug)).toContain('slug-two');
      expect(eligibleForced.map((e) => e.slug)).not.toContain('slug-three');

      const latest = findLatestVideo(tempDir);
      expect(latest).toBeDefined();
    });
  });
});

describe('long-form metadata', () => {
  const spec = {
    totalFrames: 30 * 700,
    video: {width: 1920, height: 1080},
    chapters: [
      {title: 'Mở đầu', startFrame: 0},
      {title: 'Chuyện gì xảy ra?', startFrame: 30 * 75},
      {title: 'Ảnh hưởng tới bạn', startFrame: 30 * 3605},
    ],
  };

  it('detects a landscape spec as long-form', () => {
    expect(isLongFormSpec(spec)).toBe(true);
    expect(isLongFormSpec({video: {width: 1080, height: 1920}})).toBe(false);
    expect(isLongFormSpec({})).toBe(false);
  });

  it('formats chapters YouTube will render, and drops invalid lists', () => {
    expect(formatYouTubeChapters({...spec, totalFrames: 30 * 3700})).toBe(
      '⏱ Mốc chương\n00:00 Mở đầu\n01:15 Chuyện gì xảy ra?\n1:00:05 Ảnh hưởng tới bạn',
    );
    expect(formatYouTubeChapters({...spec, chapters: spec.chapters.slice(0, 2)})).toBe('');
    expect(formatYouTubeChapters({...spec, chapters: [{title: 'a', startFrame: 30}, ...spec.chapters.slice(1)]})).toBe('');
  });
});

describe('timelineToSrt', () => {
  it('splits cues at sentence ends, pauses and the word cap', () => {
    const w = (word, start) => ({word, start, end: start + 0.3});
    const srt = timelineToSrt([w('Một', 0), w('câu.', 0.4), w('Hai', 1), w('ba', 2.5), w('bốn', 2.9)], {maxWords: 10});
    expect(srt).toBe('1\n00:00:00,000 --> 00:00:00,700\nMột câu.\n\n2\n00:00:01,000 --> 00:00:01,300\nHai\n\n3\n00:00:02,500 --> 00:00:03,200\nba bốn\n');
  });
});
