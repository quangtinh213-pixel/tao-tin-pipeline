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
  isLongFormDir,
  resolveVideoTitle,
  validatePreUpload,
  linkShortsToLongVideo,
  buildFirstComment,
  postFirstComment,
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
    expect(slot.toISOString()).toBe(new Date('2026-11-01T13:30:00+07:00').toISOString());
  });

  it('spreads a batch of five 90 minutes apart and rolls over to the next day', () => {
    const taken = [];
    const now = new Date('2026-11-01T20:00:00+07:00');
    for (let i = 0; i < 5; i += 1) taken.push(nextPublishSlot(taken, {now}).getTime());
    expect(taken.map((t) => new Date(t).toISOString())).toEqual([
      '2026-11-01T14:30:00.000Z', // 21:30 VN
      '2026-11-02T00:00:00.000Z', // 07:00 next day
      '2026-11-02T02:00:00.000Z', // 09:00
      '2026-11-02T04:30:00.000Z', // 11:30
      '2026-11-02T06:30:00.000Z', // 13:30
    ]);
  });

  it('honours a custom gap', () => {
    const taken = [at('2026-11-01T17:30:00+07:00')];
    const slot = nextPublishSlot(taken, {now: new Date('2026-11-01T17:00:00+07:00'), gapMinutes: 30});
    expect(slot.toISOString()).toBe(new Date('2026-11-01T19:30:00+07:00').toISOString());
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

describe('Task 3: pre-upload gate, HyperFrames detection & Shorts->Long linking', () => {
  it('blocks 0s/corrupt videos and raw slug titles in validatePreUpload', () => {
    expect(() => validatePreUpload({title: 'Tin hợp lệ hôm nay', durationSec: 0})).toThrow(/thời lượng/i);
    expect(() => validatePreUpload({title: 'Tin hợp lệ hôm nay', durationSec: 4.5})).toThrow(/thời lượng/i);
    expect(() => validatePreUpload({title: 'podcast-den-noi-quan-dong-cua-v2 #Shorts', durationSec: 45})).toThrow(/slug/i);
    expect(() => validatePreUpload({title: 'Đại án Sen Tài Thu 1.000 tỷ: tiền đi đâu?', durationSec: 520})).not.toThrow();
  });

  it('detects HyperFrames long-form directory via canh.json without Remotion spec.json', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-long-'));
    fs.writeFileSync(path.join(dir, 'canh.json'), JSON.stringify({scenes: [{id: 1}]}));
    expect(isLongFormDir(dir, null, () => 480)).toBe(true);
    expect(isLongFormDir(dir, null, () => 45)).toBe(false);
    fs.rmSync(dir, {recursive: true, force: true});
  });

  it('links matching recent Shorts to the new Long video idempotently', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-shorts-'));
    const sDir = path.join(dir, '2026-11-15-sen-tai-thu');
    fs.mkdirSync(sDir, {recursive: true});
    fs.writeFileSync(path.join(sDir, 'youtube.json'), JSON.stringify({
      videoId: 'short123',
      title: '3 lần mang 26 tỷ chạy án vụ Sen Tài Thu #Shorts',
      uploadedAt: new Date().toISOString(),
    }));

    const updates = [];
    let currentDesc = 'Mô tả gốc của Short';
    const mockYoutube = {
      videos: {
        list: async () => ({data: {items: [{id: 'short123', snippet: {title: '3 lần mang 26 tỷ chạy án vụ Sen Tài Thu #Shorts', description: currentDesc, categoryId: '25'}}]}}),
        update: async ({requestBody}) => {
          currentDesc = requestBody.snippet.description;
          updates.push(requestBody);
          return {data: {id: 'short123'}};
        },
      },
    };

    const linked1 = await linkShortsToLongVideo({
      youtube: mockYoutube,
      longVideoId: 'LONG999',
      longTitle: 'Toàn cảnh đại án Sen Tài Thu 1.000 tỷ: 26 tỷ chạy án đi đâu?',
      videosDir: dir,
    });
    expect(linked1).toEqual(['short123']);
    expect(updates).toHaveLength(1);
    expect(updates[0].snippet.description).toContain('https://youtu.be/LONG999');
    expect(updates[0].snippet.description).toContain('Mô tả gốc của Short');

    // Second run must be idempotent
    const linked2 = await linkShortsToLongVideo({
      youtube: mockYoutube,
      longVideoId: 'LONG999',
      longTitle: 'Toàn cảnh đại án Sen Tài Thu 1.000 tỷ: 26 tỷ chạy án đi đâu?',
      videosDir: dir,
    });
    expect(linked2).toEqual([]);
    expect(updates).toHaveLength(1);
    fs.rmSync(dir, {recursive: true, force: true});
  });

  it('resolves HyperFrames title from mo-ta.txt/chu-de.md and finds final.mp4 in findEligibleVideos (C1, I1)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-title-'));
    const vDir = path.join(dir, '2026-11-16-dai-an-test');
    fs.mkdirSync(vDir, {recursive: true});
    fs.writeFileSync(path.join(vDir, 'final.mp4'), 'video');
    fs.writeFileSync(path.join(vDir, 'mo-ta.txt'), 'Đại án 1.000 tỷ: tiền đi đâu?\n\nMô tả chi tiết');

    expect(resolveVideoTitle(vDir, '2026-11-16-dai-an-test')).toBe('Đại án 1.000 tỷ: tiền đi đâu?');
    const eligible = findEligibleVideos(dir);
    expect(eligible.map((e) => e.slug)).toContain('2026-11-16-dai-an-test');
    fs.rmSync(dir, {recursive: true, force: true});
  });

  it('links Shorts listed in performance.json even when local Short folder was deleted (I4)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-link-'));
    const perfPath = path.join(dir, 'performance.json');
    fs.writeFileSync(perfPath, JSON.stringify({
      videos: [{
        videoId: 'shortPerf1',
        title: '3 lần mang 26 tỷ chạy án vụ Sen Tài Thu #Shorts',
        publishAt: new Date().toISOString(),
        isShort: true,
      }],
    }));
    const updates = [];
    const mockYoutube = {
      videos: {
        list: async () => ({data: {items: [{id: 'shortPerf1', snippet: {title: '3 lần mang 26 tỷ chạy án vụ Sen Tài Thu #Shorts', description: 'Gốc', categoryId: '25'}}]}}),
        update: async ({requestBody}) => {
          updates.push(requestBody);
          return {data: {id: 'shortPerf1'}};
        },
      },
    };
    const linked = await linkShortsToLongVideo({
      youtube: mockYoutube,
      longVideoId: 'LONG888',
      longTitle: 'Toàn cảnh đại án Sen Tài Thu 1.000 tỷ: 26 tỷ chạy án đi đâu?',
      videosDir: dir,
      performancePath: perfPath,
    });
    expect(linked).toEqual(['shortPerf1']);
    expect(updates).toHaveLength(1);
    fs.rmSync(dir, {recursive: true, force: true});
  });
});

describe('first comment generation & posting', () => {
  it('extracts closing discussion question from caption body while skipping 🔴 hook and hashtags', () => {
    const caption = [
      '🔴 NÓNG: Vì sao xe dừng đỗ ven đường trở thành cái bẫy nguy hiểm?',
      'Chỉ trong 11 tháng, TPHCM ghi nhận 107 vụ tai nạn liên quan xe dừng đỗ.',
      'Để hạn chế tai nạn, tài xế dừng đỗ tùy tiện trong đêm cần bị xử lý ra sao?',
      '⚠️ Người xem nên quan sát kỹ khi di chuyển ban đêm.',
      '#VnNews213 #tintuc',
    ].join('\n\n');

    const comment = buildFirstComment({
      title: 'Liên tiếp tai nạn xe dừng đỗ #Shorts',
      captionText: caption,
    });
    expect(comment).toContain('Để hạn chế tai nạn, tài xế dừng đỗ tùy tiện trong đêm cần bị xử lý ra sao?');
    expect(comment).not.toContain('🔴 NÓNG');
    expect(comment).toContain('Cùng để lại bình luận bên dưới nhé!');
  });

  it('extracts closing question from kich-ban.md when caption has no body question', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'first-cmt-kb-'));
    fs.writeFileSync(
      path.join(dir, 'kich-ban.md'),
      '# Sen Tài Thu 1.000 tỷ: 26 tỷ chạy án đi đâu?\n\n' +
      '### Beat 1: Mở đầu\n**Lời đọc:**\nHồ sơ vụ án hé lộ số tiền 1.000 tỷ đồng.\n\n' +
      '### Beat 6: Câu hỏi cuối\n**Lời đọc:**\nTheo bạn, người dân cần nhận diện bẫy lãi cao [#s1] ra sao?\n',
    );
    const comment = buildFirstComment({
      slugDir: dir,
      title: 'Sen Tài Thu 1.000 tỷ: 26 tỷ chạy án đi đâu?',
      captionText: 'VN NEWS cập nhật diễn biến mới nhất.\n\n#VnNews213',
    });
    expect(comment).toContain('Theo bạn, người dân cần nhận diện bẫy lãi cao ra sao?');
    expect(comment).not.toContain('[#s1]');
    fs.rmSync(dir, {recursive: true, force: true});
  });

  it('falls back to title question clause or generic prompt when needed', () => {
    const fromTitle = buildFirstComment({
      title: 'Miễn phí vé metro Hà Nội: 5 nhóm người dân nào được hưởng?',
      captionText: '',
    });
    expect(fromTitle).toContain('5 nhóm người dân nào được hưởng?');

    const fromGeneric = buildFirstComment({
      title: 'Chi tiền tỷ làm bệnh án giả xin hoãn án tù #Shorts',
      captionText: '',
    });
    expect(fromGeneric).toContain('Chi tiền tỷ làm bệnh án giả xin hoãn án tù');
    expect(fromGeneric).not.toContain('#Shorts');
  });

  it('posts comment via commentThreads.insert and handles missing API safely', async () => {
    const calls = [];
    const mockYoutube = {
      commentThreads: {
        insert: async (payload) => {
          calls.push(payload);
          return {data: {id: 'cmt_001'}};
        },
      },
    };
    const id = await postFirstComment({
      youtube: mockYoutube,
      videoId: 'vid_abc',
      commentText: '💬 Ý kiến của bạn thế nào?',
    });
    expect(id).toBe('cmt_001');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId: 'vid_abc',
          topLevelComment: {
            snippet: {
              textOriginal: '💬 Ý kiến của bạn thế nào?',
            },
          },
        },
      },
    });

    const missingApiId = await postFirstComment({
      youtube: {},
      videoId: 'vid_abc',
      commentText: '💬 Test',
    });
    expect(missingApiId).toBeNull();
  });
});
