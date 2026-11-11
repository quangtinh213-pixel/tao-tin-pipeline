import {describe, expect, it, vi} from 'vitest';
import {buildCandidatePool, createDefaultClient, modelCandidates, parsePicksJson, rankArticles, validatePicks} from './rank-news.mjs';

const now = new Date('2026-10-30T01:00:00Z');
const item = (sourceId, n, hoursAgo = 1) => ({
  title: `${sourceId} ${n}`,
  link: `https://${sourceId}.vn/${n}`,
  pubDate: new Date(now.getTime() - hoursAgo * 3_600_000).toUTCString(),
  description: 'mô tả '.repeat(80),
  thumbnail: n % 2 ? 'https://img/x.jpg' : null,
  source: sourceId.toUpperCase(),
  sourceId,
});
const a1 = item('a', 1);
const a2 = item('a', 2);
const a3 = item('a', 3);
const b1 = item('b', 1);

describe('rank-news', () => {
  it('parsePicksJson tolerates code fences and prose', () => {
    expect(parsePicksJson('Đây:\n```json\n{"picks":[{"index":2,"reason":"nóng"}]}\n```')).toEqual([{index: 2, reason: 'nóng'}]);
    expect(parsePicksJson('không có json')).toEqual([]);
    expect(parsePicksJson('{"picks": "sai"}')).toEqual([]);
    expect(parsePicksJson('{hỏng')).toEqual([]);
  });

  it('validatePicks drops out-of-range, duplicate, non-integer and >2 per source', () => {
    const c = [a1, a2, a3, b1];
    const r = validatePicks(
      [{index: 9}, {index: 0, reason: 'r0'}, {index: 0}, {index: 1.5}, {index: 1}, {index: 2}, {index: 3}],
      c,
      {count: 3},
    );
    expect(r.map((x) => x.link)).toEqual([a1.link, a2.link, b1.link]);
    expect(r[0].reason).toBe('r0');
    expect(r[1].reason).toBe('');
  });

  it('buildCandidatePool caps 10 per source and 30 total, newest first, interleaved', () => {
    const grouped = {};
    for (const s of ['a', 'b', 'c', 'd']) {
      grouped[s] = Array.from({length: 15}, (_, i) => item(s, i, 15 - i)); // newest last
    }
    const pool = buildCandidatePool(grouped);
    expect(pool).toHaveLength(30);
    for (const s of ['a', 'b', 'c', 'd']) {
      expect(pool.filter((x) => x.sourceId === s).length).toBeLessThanOrEqual(10);
    }
    expect(pool.slice(0, 4).map((x) => x.link)).toEqual(['a', 'b', 'c', 'd'].map((s) => `https://${s}.vn/14`));
  });

  it('rankArticles sends recentTitles and compact candidates, returns validated picks with reason', async () => {
    const create = vi.fn().mockResolvedValue({output_text: '{"picks":[{"index":1,"reason":"tác động lớn"}]}'});
    const r = await rankArticles([a1, b1], {count: 3, recentTitles: ['Tin cũ đã đăng'], client: {responses: {create}}, model: 'm', now});
    expect(r).toEqual([{...b1, reason: 'tác động lớn'}]);
    const request = create.mock.calls[0][0];
    expect(request.model).toBe('m');
    const sent = JSON.stringify(request.input);
    expect(sent).toContain('Tin cũ đã đăng');
    expect(sent).not.toContain('mô tả '.repeat(40)); // description cut to 200 chars
    expect(sent).toContain('hasImage');
  });

  it('rankArticles falls through to the next model when one is unavailable', async () => {
    const create = vi.fn(async ({model}) => {
      if (model === 'm1') throw new Error('503 No compatible account is available for this model');
      return {output_text: '{"picks":[{"index":0,"reason":"ok"}]}'};
    });
    const r = await rankArticles([a1], {count: 1, client: {responses: {create}}, models: ['m1', 'm2'], now});
    expect(r).toEqual([{...a1, reason: 'ok'}]);
    expect(create.mock.calls.map(([req]) => req.model)).toEqual(['m1', 'm2']);
  });

  it('modelCandidates puts OPENAI_MODEL first and dedupes the agent fallbacks', () => {
    expect(modelCandidates('gpt-5.5')).toEqual(['gpt-5.5', 'gpt-5.6-terra', 'gpt-5.6-luna']);
    expect(modelCandidates(undefined)).toEqual(['gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5']);
  });

  it('createDefaultClient applies timeout and retry limits so a hung proxy cannot stall a batch', async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    try {
      const client = await createDefaultClient({timeout: 30_000, maxRetries: 0});
      expect(client.timeout).toBe(30_000);
      expect(client.maxRetries).toBe(0);
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });

  it('rankArticles returns [] when the client throws', async () => {
    const create = vi.fn().mockRejectedValue(new Error('Connection error.'));
    const logs = [];
    expect(await rankArticles([a1], {count: 1, client: {responses: {create}}, model: 'm', onLog: (m) => logs.push(m)})).toEqual([]);
    expect(logs.join(' ')).toContain('Connection error.');
  });

  it('rankArticles skips the call when there are no candidates', async () => {
    const create = vi.fn();
    expect(await rankArticles([], {count: 3, client: {responses: {create}}, model: 'm'})).toEqual([]);
    expect(create).not.toHaveBeenCalled();
  });
});
