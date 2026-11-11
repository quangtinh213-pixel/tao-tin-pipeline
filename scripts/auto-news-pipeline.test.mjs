import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {
  DEFAULT_FEEDS,
  acquireLock,
  checkOpenAiProxy,
  fetchFeedItems,
  filterCandidates,
  formatBatchSummary,
  isFresh,
  isHistoryBlocking,
  isQuotaError,
  loadProcessedHistory,
  matchesFeedDomain,
  normalizeUrl,
  upsertHistory,
  parseRssXml,
  releaseLock,
  runAutoNewsBatch,
  saveProcessedHistory,
  selectArticlesForBatch,
} from './auto-news-pipeline.mjs';

describe('auto-news-pipeline', () => {
  describe('parseRssXml', () => {
    it('parses rss xml with CDATA and image tags cleanly', () => {
      const sampleXml = `
        <rss version="2.0">
          <channel>
            <item>
              <title><![CDATA[<b>Tiêu đề tin tức 1</b>]]></title>
              <link>https://vnexpress.net/tin-1.html</link>
              <pubDate>Mon, 26 Oct 2026 14:00:00 +0700</pubDate>
              <description><![CDATA[<a href="#"><img src="https://example.com/thumb.jpg" /></a>Nội dung tóm tắt]]></description>
            </item>
            <item>
              <title>Tiêu đề tin tức 2</title>
              <link>https://tuoitre.vn/tin-2.html</link>
              <pubDate>Mon, 26 Oct 2026 15:00:00 +0700</pubDate>
              <description>Mô tả không có ảnh</description>
            </item>
          </channel>
        </rss>
      `;

      const items = parseRssXml(sampleXml, 'VnExpress', 'vnexpress');
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        title: 'Tiêu đề tin tức 1',
        link: 'https://vnexpress.net/tin-1.html',
        pubDate: 'Mon, 26 Oct 2026 14:00:00 +0700',
        description: 'Nội dung tóm tắt',
        thumbnail: 'https://example.com/thumb.jpg',
        source: 'VnExpress',
        sourceId: 'vnexpress',
      });
      expect(items[1].title).toBe('Tiêu đề tin tức 2');
      expect(items[1].thumbnail).toBeNull();
    });

    it('returns empty array when item tags are absent', () => {
      const emptyXml = '<rss><channel><title>Empty</title></channel></rss>';
      expect(parseRssXml(emptyXml)).toEqual([]);
    });
  });

  describe('selectArticlesForBatch', () => {
    it('balances selection round-robin across sources and avoids duplicates', () => {
      const grouped = {
        tuoitre: [
          {title: 'TT 1', link: 'https://tuoitre.vn/1'},
          {title: 'TT 2', link: 'https://tuoitre.vn/2'},
        ],
        vnexpress: [
          {title: 'VNE 1', link: 'https://vnexpress.net/1'},
          {title: 'VNE 2', link: 'https://vnexpress.net/2'},
        ],
        dantri: [
          {title: 'DT 1', link: 'https://dantri.com.vn/1'},
          {title: 'DT 2', link: 'https://dantri.com.vn/2'},
        ],
      };

      const processed = new Set(['https://tuoitre.vn/1']);
      const selected = selectArticlesForBatch(grouped, processed, 3);

      expect(selected).toHaveLength(3);
      // TT 1 was processed, so it should pick TT 2
      expect(selected.map((s) => s.link)).toEqual([
        'https://tuoitre.vn/2',
        'https://vnexpress.net/1',
        'https://dantri.com.vn/1',
      ]);
    });

    it('falls back to remaining sources if one source has exhausted items', () => {
      const grouped = {
        tuoitre: [],
        vnexpress: [
          {title: 'VNE 1', link: 'https://vnexpress.net/1'},
          {title: 'VNE 2', link: 'https://vnexpress.net/2'},
        ],
        dantri: [
          {title: 'DT 1', link: 'https://dantri.com.vn/1'},
        ],
      };

      const selected = selectArticlesForBatch(grouped, new Set(), 3);
      expect(selected).toHaveLength(3);
      expect(selected.map((s) => s.link)).toEqual([
        'https://vnexpress.net/1',
        'https://dantri.com.vn/1',
        'https://vnexpress.net/2',
      ]);
    });
  });

  describe('history loading and saving', () => {
    let testDir;

    beforeEach(async () => {
      testDir = await mkdtemp(join(tmpdir(), 'auto-news-test-'));
    });

    afterEach(async () => {
      await rm(testDir, {recursive: true, force: true});
    });

    it('loads processed urls from history file and videos context.txt', async () => {
      const historyFile = join(testDir, 'history.json');
      const videosDir = join(testDir, 'videos');

      await mkdir(join(videosDir, '2026-10-26-slug-a'), {recursive: true});
      await writeFile(
        join(videosDir, '2026-10-26-slug-a', 'context.txt'),
        'https://vnexpress.net/bai-da-lam.html\n',
      );

      saveProcessedHistory(historyFile, [
        {url: 'https://tuoitre.vn/bai-1.html', slug: 'slug-1'},
      ]);

      const {processedUrls, processedSlugs, historyList} = loadProcessedHistory(historyFile, videosDir);
      expect(processedUrls.has('https://tuoitre.vn/bai-1.html')).toBe(true);
      expect(processedUrls.has('https://vnexpress.net/bai-da-lam.html')).toBe(true);
      expect(processedSlugs.has('2026-10-26-slug-a')).toBe(true);
      expect(historyList).toHaveLength(1);
    });
  });

  describe('runAutoNewsBatch', () => {
    const NOW = new Date('2026-10-30T01:00:00Z');
    const FRESH = 'Fri, 30 Oct 2026 07:00:00 +0700';
    const STALE = 'Sun, 07 Sep 2025 21:57:53 +0700';
    let testDir;
    let historyFile;
    let videosDir;
    let lockFile;

    const rss = (items) => `<rss><channel>${items
      .map(([title, link, pubDate = FRESH]) => `<item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate></item>`)
      .join('')}</channel></rss>`;

    const mockFeeds = (byUrl) => {
      globalThis.fetch = vi.fn(async (url) => ({ok: true, text: async () => byUrl[url] ?? rss([])}));
    };

    // statusFor(context, attempt) -> final job status; attempt 1 = first run, 2 = after retryJob
    const makeManager = (statusFor = () => 'completed') => {
      const jobs = new Map();
      let counter = 0;
      return {
        createJob: vi.fn(async ({context}) => {
          counter += 1;
          const job = {id: `job-${counter}`, slug: `slug-${counter}`, context, attempt: 1};
          job.status = statusFor(context, 1);
          if (job.status === 'failed') job.error = 'render lỗi';
          jobs.set(job.id, job);
          return job;
        }),
        getJob: (id) => jobs.get(id),
        retryJob: vi.fn(async (id) => {
          const job = jobs.get(id);
          job.attempt += 1;
          job.status = statusFor(job.context, job.attempt);
          return job;
        }),
      };
    };

    const okUploader = () => vi.fn(async (slug) => ({videoId: `v-${slug}`, url: `https://youtu.be/v-${slug}`}));

    const base = (overrides = {}) => ({
      rootDir: testDir,
      feeds: [{source: 'Nguồn A', id: 'a', urls: ['https://a.vn/rss']}],
      count: 1,
      historyFile,
      videosDir,
      lockFile,
      now: () => NOW,
      preflight: async () => true,
      ranker: vi.fn(async (pool, {count}) => pool.slice(0, count).map((item) => ({...item, reason: 't'}))),
      notify: vi.fn().mockResolvedValue(true),
      onLog: () => {},
      productionManager: makeManager(),
      uploader: okUploader(),
      ...overrides,
    });

    const readHistory = async () => JSON.parse(await readFile(historyFile, 'utf8'));

    beforeEach(async () => {
      testDir = await mkdtemp(join(tmpdir(), 'auto-news-batch-'));
      historyFile = join(testDir, 'history.json');
      videosDir = join(testDir, 'videos');
      lockFile = join(testDir, 'auto-news.lock');
    });

    afterEach(async () => {
      await rm(testDir, {recursive: true, force: true});
    });

    it('performs dry-run without lock, production, uploader or notify', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Bài 1', 'https://a.vn/1'], ['Bài 2', 'https://a.vn/2']])});
      const opts = base({count: 2, dryRun: true});
      const result = await runAutoNewsBatch(opts);
      expect(result.dryRun).toBe(true);
      expect(result.processed.map((x) => x.reason)).toEqual(['t', 't']);
      expect(opts.uploader).not.toHaveBeenCalled();
      expect(opts.productionManager.createJob).not.toHaveBeenCalled();
      expect(opts.notify).not.toHaveBeenCalled();
      expect(existsSync(lockFile)).toBe(false);
    });

    it('produces, uploads, records completed history and passes recent titles to the ranker', async () => {
      saveProcessedHistory(historyFile, [{
        url: 'https://a.vn/old', title: 'Đã đăng sáng nay', status: 'completed',
        processedAt: new Date(NOW.getTime() - 2 * 3_600_000).toISOString(),
      }, {
        url: 'https://a.vn/older', title: 'Đăng hôm kia', status: 'completed',
        processedAt: new Date(NOW.getTime() - 48 * 3_600_000).toISOString(),
      }]);
      mockFeeds({'https://a.vn/rss': rss([['Tin nóng', 'https://a.vn/hot']])});
      const opts = base();
      const result = await runAutoNewsBatch(opts);

      expect(result.processed).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(opts.uploader.mock.calls[0][0]).toBe('slug-1');
      expect(opts.ranker.mock.calls[0][1].recentTitles).toEqual(['Đã đăng sáng nay']);
      const saved = await readHistory();
      expect(saved.find((x) => x.url === 'https://a.vn/hot')).toMatchObject({
        status: 'completed', slug: 'slug-1', youtubeUrl: 'https://youtu.be/v-slug-1', reason: 't',
      });
      expect(opts.notify).toHaveBeenCalledTimes(1);
      expect(opts.notify.mock.calls[0][0]).toContain('✅ Đợt 08:00 30/10 — 1/1 video');
      expect(existsSync(lockFile)).toBe(false);
    });

    it('aborts on proxy failure without touching history', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Tin', 'https://a.vn/1']])});
      const opts = base({preflight: async () => false});
      const result = await runAutoNewsBatch(opts);
      expect(result.aborted).toBe('proxy');
      expect(existsSync(historyFile)).toBe(false);
      expect(opts.productionManager.createJob).not.toHaveBeenCalled();
      expect(opts.notify.mock.calls[0][0]).toContain('Proxy OpenAI');
      expect(existsSync(lockFile)).toBe(false);
    });

    it('exits early when another live batch holds the lock and leaves the lock alone', async () => {
      await writeFile(lockFile, JSON.stringify({pid: process.pid, startedAt: NOW.toISOString()}));
      mockFeeds({'https://a.vn/rss': rss([['Tin', 'https://a.vn/1']])});
      const opts = base();
      const result = await runAutoNewsBatch(opts);
      expect(result.aborted).toBe('locked');
      expect(opts.productionManager.createJob).not.toHaveBeenCalled();
      expect(opts.notify.mock.calls[0][0]).toContain('vẫn đang chạy');
      expect(existsSync(lockFile)).toBe(true);
    });

    it('retries a failed render once, records attempts and stops picking it after 2 failures', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Bài lỗi', 'https://a.vn/bad']])});
      const run = async () => {
        const opts = base({productionManager: makeManager(() => 'failed')});
        const result = await runAutoNewsBatch(opts);
        return {opts, result};
      };

      const first = await run();
      expect(first.opts.productionManager.retryJob).toHaveBeenCalledTimes(1);
      expect(first.result.failed).toHaveLength(1);
      expect(first.opts.uploader).not.toHaveBeenCalled();
      expect((await readHistory())[0]).toMatchObject({status: 'failed', attempts: 1, lastError: 'render lỗi'});

      await run();
      expect((await readHistory())[0]).toMatchObject({status: 'failed', attempts: 2});

      const third = await run();
      expect(third.result.aborted).toBe('no-news');
      expect(third.opts.productionManager.createJob).not.toHaveBeenCalled();
    });

    it('succeeds when the single retry works', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Bài', 'https://a.vn/1']])});
      const opts = base({productionManager: makeManager((_, attempt) => (attempt === 1 ? 'failed' : 'completed'))});
      const result = await runAutoNewsBatch(opts);
      expect(result.processed).toHaveLength(1);
      expect((await readHistory())[0].status).toBe('completed');
    });

    it('stops uploads after quotaExceeded but keeps rendering', async () => {
      mockFeeds({'https://a.vn/rss': rss([['B1', 'https://a.vn/1'], ['B2', 'https://a.vn/2'], ['B3', 'https://a.vn/3']])});
      let calls = 0;
      const uploader = vi.fn(async (slug) => {
        calls += 1;
        if (calls === 2) throw Object.assign(new Error('quota'), {errors: [{reason: 'quotaExceeded'}]});
        return {videoId: 'v', url: `https://youtu.be/${slug}`};
      });
      const opts = base({count: 3, uploader});
      const result = await runAutoNewsBatch(opts);

      expect(uploader).toHaveBeenCalledTimes(2);
      expect(opts.productionManager.createJob).toHaveBeenCalledTimes(3);
      const saved = await readHistory();
      expect(saved.filter((x) => x.status === 'completed')).toHaveLength(1);
      expect(saved.filter((x) => x.status === 'rendered').map((x) => x.uploadAttempts)).toEqual([0, 0]);
      expect(result.backlog.pending).toBe(2);
      expect(opts.notify.mock.calls[0][0]).toContain('Hết quota YouTube');
      expect(opts.notify.mock.calls[0][0]).toContain('⏭ Backlog: 2 video chờ upload lại');
    });

    it('uploads backlog first and gives up after 3 upload attempts', async () => {
      saveProcessedHistory(historyFile, [
        {url: 'https://a.vn/r1', title: 'R1', source: 'Nguồn A', slug: 's1', status: 'rendered', uploadAttempts: 2},
        {url: 'https://a.vn/r2', title: 'R2', source: 'Nguồn A', slug: 's2', status: 'rendered', uploadAttempts: 0},
      ]);
      mockFeeds({});
      const uploader = vi.fn(async (slug) => {
        if (slug === 's1') throw new Error('boom');
        return {videoId: 'v2', url: 'https://youtu.be/v2'};
      });
      const opts = base({uploader});
      const result = await runAutoNewsBatch(opts);

      const saved = await readHistory();
      expect(saved[0]).toMatchObject({status: 'failed', uploadAttempts: 3});
      expect(saved[1]).toMatchObject({status: 'completed', youtubeUrl: 'https://youtu.be/v2'});
      expect(result.backlog).toEqual({uploaded: 1, pending: 0});
      expect(result.failed[0].error).toContain('upload lỗi 3 lần');
      const message = opts.notify.mock.calls.at(-1)[0];
      expect(message).toContain('R1');
      expect(message).toContain('https://youtu.be/v2');
    });

    it('falls back to rotation when the ranker returns nothing and ignores stale articles', async () => {
      mockFeeds({
        'https://a.vn/rss': rss([['Cũ', 'https://a.vn/old', STALE], ['A1', 'https://a.vn/1']]),
        'https://b.vn/rss': rss([['B1', 'https://b.vn/1']]),
      });
      const opts = base({
        count: 2,
        feeds: [
          {source: 'A', id: 'a', urls: ['https://a.vn/rss']},
          {source: 'B', id: 'b', urls: ['https://b.vn/rss']},
        ],
        ranker: vi.fn(async () => []),
      });
      const result = await runAutoNewsBatch(opts);
      expect(result.processed.map((x) => x.url).sort()).toEqual(['https://a.vn/1', 'https://b.vn/1']);
      expect(result.processed.every((x) => x.reason === 'fallback luân phiên')).toBe(true);
    });

    it('still completes when notify throws', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Tin', 'https://a.vn/1']])});
      const opts = base({notify: vi.fn().mockRejectedValue(new Error('telegram down'))});
      const result = await runAutoNewsBatch(opts);
      expect(result.processed).toHaveLength(1);
      expect(existsSync(lockFile)).toBe(false);
    });

    it('sends a no-news message when nothing fresh is available', async () => {
      mockFeeds({'https://a.vn/rss': rss([['Cũ', 'https://a.vn/old', STALE]])});
      const opts = base();
      const result = await runAutoNewsBatch(opts);
      expect(result.aborted).toBe('no-news');
      expect(opts.notify.mock.calls[0][0]).toContain('📭');
    });
  });

  describe('formatBatchSummary', () => {
    it('matches the spec layout', () => {
      expect(formatBatchSummary({
        slotLabel: '08:00 30/10',
        processed: [{source: 'Tuổi Trẻ', title: 'A', youtubeUrl: 'https://youtu.be/x', reason: 'nóng'}],
        failed: [{source: 'Dân Trí', title: 'B', error: 'render timeout'}],
        backlogPending: 1,
        notes: [],
      })).toBe('✅ Đợt 08:00 30/10 — 1/2 video\n1. [Tuổi Trẻ] A → https://youtu.be/x\n   Lý do: nóng\n❌ [Dân Trí] B — render timeout\n⏭ Backlog: 1 video chờ upload lại');
    });

    it('marks an all-failed batch and an empty batch', () => {
      expect(formatBatchSummary({slotLabel: '17:30 30/10', processed: [], failed: [{source: 'A', title: 'B', error: 'x'.repeat(300)}], backlogPending: 0, notes: ['ghi chú']}))
        .toBe(`❌ Đợt 17:30 30/10 — 0/1 video\n❌ [A] B — ${'x'.repeat(120)}\nghi chú`);
      expect(formatBatchSummary({slotLabel: '17:30 30/10', processed: [], failed: [], backlogPending: 0, notes: []}))
        .toBe('📭 Đợt 17:30 30/10 — không có tin mới phù hợp');
    });

    it('shows a pending upload without a link', () => {
      expect(formatBatchSummary({slotLabel: '08:00 30/10', processed: [{source: 'A', title: 'T', youtubeUrl: null, reason: ''}], failed: [], backlogPending: 1, notes: []}))
        .toBe('✅ Đợt 08:00 30/10 — 1/1 video\n1. [A] T → (chờ upload)\n⏭ Backlog: 1 video chờ upload lại');
    });
  });
});

describe('filters', () => {
  const now = new Date('2026-10-30T01:00:00Z'); // 08:00 +07

  it('isFresh accepts the real pubDate formats of all three outlets within 12h', () => {
    expect(isFresh({pubDate: 'Fri, 30 Oct 2026 07:30:00 +0700'}, now)).toBe(true); // VnExpress, Dân Trí
    expect(isFresh({pubDate: '10/30/2026 7:40:00 AM'}, now)).toBe(true); // Tuổi Trẻ, no TZ = +07
    expect(isFresh({pubDate: '10/29/2026 6:40:00 PM'}, now)).toBe(false); // 18:40 +07 hôm trước = 13h20 trước
    expect(isFresh({pubDate: '10/29/2026 8:01:00 PM'}, now)).toBe(true); // 11h59 trước
    expect(isFresh({pubDate: '10/29/2026 7:40:00 AM'}, now)).toBe(false); // 24h20 trước
    expect(isFresh({pubDate: 'Thu, 29 Oct 2026 20:05:00 +0700'}, now)).toBe(true); // 11h55 trước
    expect(isFresh({pubDate: 'Thu, 29 Oct 2026 19:59:00 +0700'}, now)).toBe(false); // 12h01 trước
    expect(isFresh({pubDate: 'Fri, 30 Oct 2026 07:00:00 GMT+7'}, now)).toBe(true);
    expect(isFresh({pubDate: 'Sun, 07 Sep 2025 21:57:53 +0700'}, now)).toBe(false);
  });

  it('isFresh boundaries and unparseable dates', () => {
    expect(isFresh({pubDate: '2026-10-29T13:00:00Z'}, now)).toBe(true);
    expect(isFresh({pubDate: '2026-10-29T12:59:00Z'}, now)).toBe(false);
    expect(isFresh({pubDate: '2026-10-30T01:09:00Z'}, now)).toBe(true);
    expect(isFresh({pubDate: '2026-10-30T01:11:00Z'}, now)).toBe(false);
    expect(isFresh({pubDate: ''}, now)).toBe(false);
    expect(isFresh({}, now)).toBe(false);
    expect(isFresh({pubDate: 'hôm qua'}, now)).toBe(false);
  });

  it('matchesFeedDomain rejects staging mirrors and look-alikes', () => {
    expect(matchesFeedDomain('https://dantri.com.vn/a.htm', ['dantri.com.vn'])).toBe(true);
    expect(matchesFeedDomain('https://m.dantri.com.vn/a.htm', ['dantri.com.vn'])).toBe(true);
    expect(matchesFeedDomain('https://2022.dantri.dev/a.htm', ['dantri.com.vn'])).toBe(false);
    expect(matchesFeedDomain('https://evil-dantri.com.vn/a', ['dantri.com.vn'])).toBe(false);
    expect(matchesFeedDomain('not a url', ['dantri.com.vn'])).toBe(false);
    expect(matchesFeedDomain('https://x.vn/a')).toBe(true);
  });

  it('DEFAULT_FEEDS declare domains and avoid the stale Dân Trí xa-hoi feed', () => {
    expect(DEFAULT_FEEDS.map((f) => f.domains)).toEqual([['tuoitre.vn'], ['vnexpress.net'], ['dantri.com.vn']]);
    expect(DEFAULT_FEEDS.flatMap((f) => f.urls)).not.toContain('https://dantri.com.vn/rss/xa-hoi.rss');
  });

  it('normalizeUrl strips query, hash and trailing slash', () => {
    expect(normalizeUrl('https://vnexpress.net/a.html?utm=1#c')).toBe('https://vnexpress.net/a.html');
    expect(normalizeUrl('https://tuoitre.vn/a/')).toBe('https://tuoitre.vn/a');
    expect(normalizeUrl('  khong-phai-url ')).toBe('khong-phai-url');
  });

  it('history blocks completed/rendered/legacy and failed>=2 only', () => {
    expect(isHistoryBlocking({url: 'u'})).toBe(true);
    expect(isHistoryBlocking({status: 'completed'})).toBe(true);
    expect(isHistoryBlocking({status: 'rendered'})).toBe(true);
    expect(isHistoryBlocking({status: 'failed', attempts: 1})).toBe(false);
    expect(isHistoryBlocking({status: 'failed', attempts: 2})).toBe(true);
  });

  it('loadProcessedHistory only blocks blocking entries, with normalized urls', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'auto-news-hist-'));
    const historyFile = join(dir, 'h.json');
    saveProcessedHistory(historyFile, [
      {url: 'https://a.vn/ok?utm=1', status: 'completed'},
      {url: 'https://a.vn/fail1', status: 'failed', attempts: 1},
    ]);
    const {processedUrls} = loadProcessedHistory(historyFile, join(dir, 'videos'));
    expect(processedUrls.has('https://a.vn/ok')).toBe(true);
    expect(processedUrls.has('https://a.vn/fail1')).toBe(false);
    await rm(dir, {recursive: true, force: true});
  });

  it('upsertHistory merges by normalized url', () => {
    const list = [{url: 'https://a.vn/x', status: 'failed', attempts: 1, title: 'X'}];
    const entry = upsertHistory(list, {url: 'https://a.vn/x?ref=rss', status: 'failed', attempts: 2});
    expect(list).toHaveLength(1);
    expect(entry).toBe(list[0]);
    expect(list[0]).toMatchObject({title: 'X', attempts: 2});
    upsertHistory(list, {url: 'https://a.vn/y', status: 'completed'});
    expect(list).toHaveLength(2);
  });

  it('filterCandidates applies freshness, domain and history', () => {
    const feeds = [{id: 'dt', domains: ['dantri.com.vn']}];
    const fresh = 'Fri, 30 Oct 2026 07:00:00 +0700';
    const grouped = {dt: [
      {link: 'https://dantri.com.vn/ok.htm', pubDate: fresh},
      {link: 'https://dantri.com.vn/old.htm', pubDate: 'Sun, 07 Sep 2025 21:57:53 +0700'},
      {link: 'https://2022.dantri.dev/x.htm', pubDate: fresh},
      {link: 'https://dantri.com.vn/done.htm?utm=rss', pubDate: fresh},
    ]};
    const out = filterCandidates(grouped, {feeds, processedUrls: new Set(['https://dantri.com.vn/done.htm']), now});
    expect(out.dt.map((x) => x.link)).toEqual(['https://dantri.com.vn/ok.htm']);
  });

  it('parseRssXml reads the thumbnail from <enclosure> when description has no image', () => {
    const xml = '<rss><channel><item><title>T</title><link><![CDATA[https://tuoitre.vn/a.htm]]></link><enclosure url="https://cdn2.tuoitre.vn/a.jpg" length="0" type="image/jpeg" /><pubDate>10/30/2026 6:40:00 PM</pubDate></item></channel></rss>';
    expect(parseRssXml(xml, 'Tuổi Trẻ', 'tuoitre')[0].thumbnail).toBe('https://cdn2.tuoitre.vn/a.jpg');
  });
});

describe('batch guards', () => {
  let testDir;
  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'auto-news-guard-'));
  });
  afterEach(async () => {
    await rm(testDir, {recursive: true, force: true});
  });

  it('acquireLock refuses a live fresh lock and replaces dead, stale or corrupt ones', async () => {
    const lock = join(testDir, 'auto-news.lock');
    const now = new Date('2026-10-30T01:00:00Z');
    await writeFile(lock, JSON.stringify({pid: 111, startedAt: '2026-10-30T00:30:00Z'}));
    const refused = acquireLock(lock, {now, isAlive: () => true});
    expect(refused.ok).toBe(false);
    expect(refused.reason).toContain('111');
    expect(acquireLock(lock, {now, isAlive: () => false}).ok).toBe(true);
    expect(JSON.parse(await readFile(lock, 'utf8')).pid).toBe(process.pid);
    await writeFile(lock, JSON.stringify({pid: 111, startedAt: '2026-10-29T21:00:00Z'})); // 4h
    expect(acquireLock(lock, {now, isAlive: () => true}).ok).toBe(true);
    await writeFile(lock, '{hỏng');
    expect(acquireLock(lock, {now, isAlive: () => true}).ok).toBe(true);
    releaseLock(lock);
    expect(existsSync(lock)).toBe(false);
    releaseLock(lock); // missing file is fine
  });

  it('acquireLock creates a lock when none exists', () => {
    const lock = join(testDir, 'new.lock');
    expect(acquireLock(lock).ok).toBe(true);
    expect(existsSync(lock)).toBe(true);
  });

  it('checkOpenAiProxy retries 3 times with a 5 minute delay then gives up', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Connection error.'));
    const sleep = vi.fn().mockResolvedValue();
    expect(await checkOpenAiProxy({client: {responses: {create}}, models: ['m'], sleep, onLog: () => {}})).toBe(false);
    expect(create).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(300_000);
  });

  it('checkOpenAiProxy succeeds on the second try', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('Connection error.')).mockResolvedValue({output_text: 'pong'});
    const sleep = vi.fn().mockResolvedValue();
    expect(await checkOpenAiProxy({client: {responses: {create}}, models: ['m'], sleep, onLog: () => {}})).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('checkOpenAiProxy tries the fallback models within one attempt before sleeping', async () => {
    const create = vi.fn(async ({model}) => {
      if (model !== 'm2') throw Object.assign(new Error('503 No compatible account is available for this model'), {status: 503});
      return {output_text: 'pong'};
    });
    const sleep = vi.fn();
    expect(await checkOpenAiProxy({client: {responses: {create}}, models: ['m1', 'm2'], sleep, onLog: () => {}})).toBe(true);
    expect(create.mock.calls.map(([req]) => req.model)).toEqual(['m1', 'm2']);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('isQuotaError detects googleapis quotaExceeded', () => {
    expect(isQuotaError({errors: [{reason: 'quotaExceeded'}]})).toBe(true);
    expect(isQuotaError(new Error('The request cannot be completed because you have exceeded your quota.'))).toBe(true);
    expect(isQuotaError(new Error('invalid_grant'))).toBe(false);
    expect(isQuotaError(undefined)).toBe(false);
  });
});

describe('review fixes', () => {
  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'auto-news-fix-'));
  });
  afterEach(async () => {
    await rm(dir, {recursive: true, force: true});
  });

  it('selectArticlesForBatch compares normalized urls so a tracked link is not picked twice', () => {
    const grouped = {a: [{link: 'https://a.vn/1?utm=rss', title: 'A1'}, {link: 'https://a.vn/2', title: 'A2'}]};
    const picked = selectArticlesForBatch(grouped, new Set(['https://a.vn/1']), 1);
    expect(picked.map((x) => x.link)).toEqual(['https://a.vn/2']);
  });

  it('fetchFeedItems dedupes the same article across feed urls by normalized link', async () => {
    const xml = (link) => `<rss><channel><item><title>T</title><link>${link}</link></item></channel></rss>`;
    const fetcher = vi.fn(async (url) => ({ok: true, text: async () => xml(url.endsWith('1') ? 'https://a.vn/x?from=1' : 'https://a.vn/x?from=2')}));
    const items = await fetchFeedItems({source: 'A', id: 'a', urls: ['https://a.vn/rss1', 'https://a.vn/rss2']}, fetcher);
    expect(items).toHaveLength(1);
  });

  it('loadProcessedHistory keeps a once-failed article retryable even though its context.txt exists', async () => {
    const historyFile = join(dir, 'h.json');
    const videosDir = join(dir, 'videos');
    await mkdir(join(videosDir, 'slug-f'), {recursive: true});
    await writeFile(join(videosDir, 'slug-f', 'context.txt'), 'https://a.vn/fail1\n');
    await mkdir(join(videosDir, 'slug-old'), {recursive: true});
    await writeFile(join(videosDir, 'slug-old', 'context.txt'), 'https://a.vn/manual\n');
    saveProcessedHistory(historyFile, [{url: 'https://a.vn/fail1', status: 'failed', attempts: 1}]);
    const {processedUrls} = loadProcessedHistory(historyFile, videosDir);
    expect(processedUrls.has('https://a.vn/fail1')).toBe(false);
    expect(processedUrls.has('https://a.vn/manual')).toBe(true);
  });

  it('loadProcessedHistory quarantines a corrupt or non-array history instead of losing or crashing', async () => {
    const historyFile = join(dir, 'h.json');
    await writeFile(historyFile, '{"not":"an array"}');
    const {historyList} = loadProcessedHistory(historyFile, join(dir, 'videos'));
    expect(historyList).toEqual([]);
    expect(existsSync(historyFile)).toBe(false);
    const {readdirSync} = await import('node:fs');
    expect(readdirSync(dir).some((name) => name.startsWith('h.json.corrupt-'))).toBe(true);
  });

  it('saveProcessedHistory writes atomically without leaving a temp file', async () => {
    const historyFile = join(dir, 'sub', 'h.json');
    saveProcessedHistory(historyFile, [{url: 'u'}]);
    expect(JSON.parse(await readFile(historyFile, 'utf8'))).toEqual([{url: 'u'}]);
    expect(existsSync(`${historyFile}.tmp`)).toBe(false);
  });
});
