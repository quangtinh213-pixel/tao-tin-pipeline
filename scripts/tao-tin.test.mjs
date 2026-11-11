import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {finishRun, freeSlotsUntil, getCandidates, nextArticle, recordResult, selectArticles} from './tao-tin.mjs';

const NOW = new Date('2026-10-30T01:00:00Z');
const FRESH = 'Fri, 30 Oct 2026 07:00:00 +0700';
const rss = (items) => `<rss><channel>${items
  .map(([title, link, pubDate = FRESH]) => `<item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate><description>Mô tả ${title}</description></item>`)
  .join('')}</channel></rss>`;

describe('tao-tin', () => {
  let dir;
  let paths;
  const feeds = [
    {source: 'A', id: 'a', domains: ['a.vn'], urls: ['https://a.vn/rss']},
    {source: 'B', id: 'b', domains: ['b.vn'], urls: ['https://b.vn/rss']},
  ];
  const fetcher = vi.fn(async (url) => ({
    ok: true,
    text: async () => (url === 'https://a.vn/rss'
      ? rss([['A1', 'https://a.vn/1'], ['A2', 'https://a.vn/2'], ['A3', 'https://a.vn/3'], ['Cũ', 'https://a.vn/old', 'Sun, 07 Sep 2025 21:57:53 +0700']])
      : rss([['B1', 'https://b.vn/1'], ['Lạ', 'https://evil.dev/x']])),
  }));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tao-tin-'));
    paths = {
      historyFile: join(dir, 'history.json'),
      videosDir: join(dir, 'videos'),
      candidatesFile: join(dir, 'candidates.json'),
      runFile: join(dir, 'run.json'),
    };
  });

  afterEach(async () => {
    await rm(dir, {recursive: true, force: true});
  });

  const loadCandidates = () => getCandidates({...paths, feeds, fetcher, now: NOW});
  const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

  it('getCandidates returns filtered compact candidates and recent titles, and saves the pool', async () => {
    await writeFile(paths.historyFile, JSON.stringify([
      {url: 'https://a.vn/3', title: 'A3 đã đăng', status: 'completed', processedAt: '2026-10-29T23:00:00Z'},
    ]));
    const {candidates, recentTitles} = await loadCandidates();
    expect(candidates.map((c) => c.link).sort()).toEqual(['https://a.vn/1', 'https://a.vn/2', 'https://b.vn/1']);
    expect(candidates[0]).toMatchObject({index: 0, ageHours: 1, hasImage: false});
    expect(candidates[0].description).toMatch(/^Mô tả/);
    expect(recentTitles).toEqual(['A3 đã đăng']);
    expect((await readJson(paths.candidatesFile)).length).toBe(3);
  });

  it('selectArticles enforces max 2 per source and unique indices, then writes the run', async () => {
    const {candidates} = await loadCandidates();
    const aIdx = candidates.filter((c) => c.sourceId === 'a').map((c) => c.index);
    const bIdx = candidates.find((c) => c.sourceId === 'b').index;
    const picks = [...aIdx, bIdx, bIdx, 99].map((index) => ({index, reason: `r${index}`}));
    const run = selectArticles(picks, {...paths, now: NOW});
    expect(run.articles).toHaveLength(3);
    expect(run.articles.every((a) => a.status === 'pending')).toBe(true);
    expect(run.articles[0].reason).toBe(`r${aIdx[0]}`);
    expect((await readJson(paths.runFile)).startedAt).toBe(NOW.toISOString());
  });

  it('selectArticles refuses while an unfinished run still has pending articles', async () => {
    await loadCandidates();
    selectArticles([{index: 0, reason: 'x'}], {...paths, now: NOW});
    expect(() => selectArticles([{index: 1, reason: 'y'}], {...paths, now: NOW})).toThrow(/chưa xong/);
    expect(() => selectArticles([{index: 1, reason: 'y'}], {...paths, now: NOW, force: true})).not.toThrow();
  });

  it('selectArticles fails clearly without a candidates file or with no valid picks', async () => {
    expect(() => selectArticles([{index: 0}], {...paths, now: NOW})).toThrow(/candidates/);
    await loadCandidates();
    expect(() => selectArticles([{index: 42}], {...paths, now: NOW})).toThrow(/Không có bài hợp lệ/);
  });

  it('nextArticle walks pending articles and returns null at the end', async () => {
    await loadCandidates();
    selectArticles([{index: 0, reason: 'x'}, {index: 1, reason: 'y'}], {...paths, now: NOW});
    const first = nextArticle(paths);
    expect(first).toMatchObject({position: 1, total: 2});
    recordResult({...paths, url: first.link, status: 'failed', error: 'render lỗi', now: NOW});
    const second = nextArticle(paths);
    expect(second.position).toBe(2);
    recordResult({...paths, url: second.link, status: 'failed', error: 'x', now: NOW});
    expect(nextArticle(paths)).toBeNull();
  });

  it('recordResult completed reads youtube.json and writes history', async () => {
    await loadCandidates();
    const run = selectArticles([{index: 0, reason: 'nóng'}], {...paths, now: NOW});
    const article = run.articles[0];
    await mkdir(join(paths.videosDir, 'slug-1'), {recursive: true});
    await writeFile(join(paths.videosDir, 'slug-1', 'youtube.json'), JSON.stringify({videoId: 'v1', url: 'https://youtu.be/v1'}));

    recordResult({...paths, url: article.link, status: 'completed', slug: 'slug-1', now: NOW});

    const history = await readJson(paths.historyFile);
    expect(history[0]).toMatchObject({url: article.link, status: 'completed', slug: 'slug-1', youtubeUrl: 'https://youtu.be/v1', reason: 'nóng'});
    expect((await readJson(paths.runFile)).articles[0]).toMatchObject({status: 'completed', youtubeUrl: 'https://youtu.be/v1'});
  });

  it('recordResult completed without youtube.json is refused so nothing is marked posted by mistake', async () => {
    await loadCandidates();
    const run = selectArticles([{index: 0, reason: 'x'}], {...paths, now: NOW});
    expect(() => recordResult({...paths, url: run.articles[0].link, status: 'completed', slug: 'nope', now: NOW})).toThrow(/youtube.json/);
  });

  it('recordResult failed increments attempts across runs; rendered keeps a backlog entry', async () => {
    await writeFile(paths.historyFile, JSON.stringify([{url: 'https://a.vn/1', status: 'failed', attempts: 1}]));
    await loadCandidates();
    const run = selectArticles([{index: 0, reason: 'x'}, {index: 1, reason: 'y'}, {index: 2, reason: 'z'}], {...paths, now: NOW});
    const a1 = run.articles.find((a) => a.link === 'https://a.vn/1');
    const other = run.articles.find((a) => a.link !== 'https://a.vn/1');
    recordResult({...paths, url: a1.link, status: 'failed', error: 'lỗi', now: NOW});
    recordResult({...paths, url: other.link, status: 'rendered', slug: 's2', error: 'upload lỗi', now: NOW});
    const history = await readJson(paths.historyFile);
    expect(history.find((h) => h.url === 'https://a.vn/1')).toMatchObject({status: 'failed', attempts: 2, lastError: 'lỗi'});
    expect(history.find((h) => h.url === other.link)).toMatchObject({status: 'rendered', slug: 's2', uploadAttempts: 1});
  });

  it('recordResult rejects unknown urls and statuses', async () => {
    await loadCandidates();
    selectArticles([{index: 0, reason: 'x'}], {...paths, now: NOW});
    expect(() => recordResult({...paths, url: 'https://khac.vn/z', status: 'failed', now: NOW})).toThrow(/không có trong lượt/);
    expect(() => recordResult({...paths, url: 'https://a.vn/1', status: 'ok', now: NOW})).toThrow(/status/);
  });

  it('finishRun sends the batch summary, marks the run finished and survives notify errors', async () => {
    await loadCandidates();
    const run = selectArticles([{index: 0, reason: 'nóng'}, {index: 1, reason: 'y'}], {...paths, now: NOW});
    await mkdir(join(paths.videosDir, 's1'), {recursive: true});
    await writeFile(join(paths.videosDir, 's1', 'youtube.json'), JSON.stringify({videoId: 'v1', url: 'https://youtu.be/v1'}));
    recordResult({...paths, url: run.articles[0].link, status: 'completed', slug: 's1', now: NOW});
    recordResult({...paths, url: run.articles[1].link, status: 'failed', error: 'render lỗi', now: NOW});

    const notify = vi.fn().mockRejectedValue(new Error('telegram down'));
    const text = await finishRun({...paths, notify});
    expect(text).toContain('✅ Đợt 08:00 30/10 — 1/2 video');
    expect(text).toContain('https://youtu.be/v1');
    expect(text).toContain('render lỗi');
    expect(notify).toHaveBeenCalledWith(text);
    expect((await readJson(paths.runFile)).finishedAt).toBeTruthy();
    expect(() => selectArticles([{index: 0, reason: 'x'}], {...paths, now: NOW})).not.toThrow();
  });

  it('finishRun lists articles never processed as failed so nothing silently disappears', async () => {
    await loadCandidates();
    selectArticles([{index: 0, reason: 'x'}], {...paths, now: NOW});
    const text = await finishRun({...paths, notify: vi.fn()});
    expect(text).toContain('chưa được xử lý');
    expect(existsSync(paths.runFile)).toBe(true);
  });

  it('freeSlotsUntil counts only free slots before the next run', () => {
    const now = new Date('2026-11-07T03:00:00Z'); // 10:00 VN
    const slots = '11:30,12:00,12:30,13:00,15:30';
    const taken = [Date.parse('2026-11-07T04:30:00Z')]; // 11:30 đã có video
    const free = freeSlotsUntil('15:00', {now, taken, slots, gapMinutes: 30});
    expect(free.map((d) => d.toISOString())).toEqual(['2026-11-07T05:00:00.000Z', '2026-11-07T05:30:00.000Z', '2026-11-07T06:00:00.000Z']);
    expect(freeSlotsUntil('08:00', {now: new Date('2026-11-07T13:00:00Z'), taken: [], slots: '07:00', gapMinutes: 30})).toHaveLength(1); // 20:00 → 07:00 hôm sau
  });
});
