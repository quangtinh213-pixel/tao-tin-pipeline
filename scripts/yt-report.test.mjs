import {describe, expect, it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {buildSummary, fetchChannelVideos, retentionDrop, scheduledWithin} from './yt-report.mjs';

const video = (title, views, apv, publishAt) => ({title: `${title} #Shorts`, views, apv, publishAt});

describe('buildSummary', () => {
  it('reports totals, empty upload days and best/worst retention', () => {
    const summary = buildSummary({
      now: Date.parse('2026-11-05T00:00:00Z'),
      daily: [
        {day: '2026-11-01', views: 1000, subscribersGained: 3, subscribersLost: 1},
        {day: '2026-11-02', views: 50, subscribersGained: 0, subscribersLost: 0},
      ],
      videos: [
        video('Tốt', 2000, 80, '2026-11-01T05:00:00Z'),
        video('Kém', 900, 25, '2026-11-01T06:00:00Z'),
        video('Ít view', 50, 99, '2026-11-01T07:00:00Z'),
      ],
    });
    expect(summary).toContain('View: 1.050 · Sub ròng: +2 · 3 video');
    expect(summary).toContain('Ngày không đăng video: 11-02');
    expect(summary).toMatch(/tốt nhất:\n• 80% · 2000 view · Tốt/u);
    expect(summary).toMatch(/kém nhất:\n• 25% · 900 view · Kém/u);
    expect(summary).not.toContain('Ít view');
  });
});

describe('scheduledWithin', () => {
  it('counts only future publish times inside the window', () => {
    const now = 1_000_000_000;
    const hour = 3_600_000;
    expect(scheduledWithin([now - hour, now + hour, now + 23 * hour, now + 25 * hour], {now})).toBe(2);
  });
});

describe('retentionDrop', () => {
  it('finds the steepest fall after 3s and the sentence playing there', () => {
    // 100-point curve over a 50s video: flat at 80, falls 80 -> 50 at 40% (20s)
    const curve = Array.from({length: 100}, (_, i) => (i < 40 ? 80 : 50));
    const segments = [{start: 0, end: 10, text: 'Hook'}, {start: 10.5, end: 25, text: 'Câu dài'}, {start: 25, end: 50, text: 'Kết'}];
    expect(retentionDrop(curve, 50, segments)).toEqual({at: 20, ratio: 0.4, loss: 30, text: 'Câu dài'});
  });

  it('ignores the swipe-away in the first 3 seconds', () => {
    const curve = Array.from({length: 100}, (_, i) => (i < 2 ? 150 : 70 - i * 0.1));
    expect(retentionDrop(curve, 60).at).toBeGreaterThanOrEqual(3);
  });

  it('returns null without duration or curve', () => {
    expect(retentionDrop([], 30)).toBeNull();
    expect(retentionDrop(Array(100).fill(50), null)).toBeNull();
  });
});

describe('buildSummary hook-card A/B', () => {
  it('compares only videos with a stamped arm', () => {
    const summary = buildSummary({
      daily: [{day: '2026-11-01', views: 10, subscribersGained: 0, subscribersLost: 0}],
      videos: [
        {...video('A', 900, 60, '2026-11-01T06:00:00Z'), hookCardArm: 'card', retention: Array(100).fill(70)},
        {...video('B', 900, 40, '2026-11-01T07:00:00Z'), hookCardArm: 'control', retention: Array(100).fill(50)},
        video('C', 900, 99, '2026-11-01T08:00:00Z'),
      ],
    });
    expect(summary).toContain('A/B thẻ hook: có thẻ n=1 · % xem 60% · còn ở 30%: 70% | không thẻ n=1 · % xem 40% · còn ở 30%: 50%');
  });
});

describe('buildSummary retention', () => {
  it('shows the drop point and the sentence for weak videos', () => {
    const summary = buildSummary({
      daily: [{day: '2026-11-01', views: 10, subscribersGained: 0, subscribersLost: 0}],
      videos: [video('Kém', 900, 25, '2026-11-01T06:00:00Z')].map((v) => ({...v, drop: {at: 12, ratio: 0.4, loss: 20, text: 'Theo báo cáo của sở'}})),
    });
    expect(summary).toContain('rời nhiều nhất ở ~40% thời lượng (trung vị giây 12)');
    expect(summary).toContain('rời nhiều ở giây 12 · Kém\n   ↳ "Theo báo cáo của sở"');
  });
});

describe('Task 4: fetchChannelVideos & Shorts vs Long-form summary', () => {
  it('fetches uploaded videos from YouTube Data API even when local videosDir is empty', async () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-vids-'));
    const mockYt = {
      channels: {
        list: async () => ({data: {items: [{contentDetails: {relatedPlaylists: {uploads: 'UU123'}}}]}}),
      },
      playlistItems: {
        list: async () => ({
          data: {
            items: [
              {contentDetails: {videoId: 's1'}},
              {contentDetails: {videoId: 'l1'}},
            ],
          },
        }),
      },
      videos: {
        list: async () => ({
          data: {
            items: [
              {
                id: 's1',
                snippet: {title: 'Tin nóng #Shorts', publishedAt: '2026-11-15T05:00:00Z'},
                contentDetails: {duration: 'PT35S'},
                status: {privacyStatus: 'public'},
              },
              {
                id: 'l1',
                snippet: {title: 'Hồ sơ đại án 1.000 tỷ: tiền đi đâu?', publishedAt: '2026-11-14T05:00:00Z'},
                contentDetails: {duration: 'PT8M30S'},
                status: {privacyStatus: 'public'},
              },
            ],
          },
        }),
      },
    };

    const vids = await fetchChannelVideos({
      ytClient: mockYt,
      videosDir: emptyDir,
      sinceMs: Date.parse('2026-11-10T00:00:00Z'),
    });
    expect(vids).toHaveLength(2);
    expect(vids.find((v) => v.videoId === 's1')).toMatchObject({seconds: 35, isShort: true});
    expect(vids.find((v) => v.videoId === 'l1')).toMatchObject({seconds: 510, isShort: false});
    fs.rmSync(emptyDir, {recursive: true, force: true});
  });

  it('splits Shorts and Long-form stats in buildSummary', () => {
    const summary = buildSummary({
      daily: [{day: '2026-11-15', views: 2050, subscribersGained: 5, subscribersLost: 0}],
      videos: [
        {title: 'Short hay #Shorts', views: 2000, apv: 70, isShort: true, publishAt: '2026-11-15T05:00:00Z'},
        {title: 'Video dài phân tích', views: 50, apv: 40, isShort: false, publishAt: '2026-11-15T08:00:00Z'},
      ],
    });
    expect(summary).toContain('Shorts: 1 video · 2.000 view');
    expect(summary).toContain('Video dài: 1 video · 50 view');
  });
});
