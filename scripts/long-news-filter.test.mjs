import {describe, expect, it} from 'vitest';
import {
  buildQueue, classify, clusterItems, decodeEntities, gateReasons, makeMatcher, parseTrendsRss, pickDiverse, sameStory, scoreCluster,
} from './long-news-filter.mjs';
import {longSlotOptions, nextPublishSlot} from './youtube-upload.mjs';

const NOW = new Date('2026-11-09T10:00:00+07:00');
const item = (title, host, minutesAgo = 120, description = '') => ({
  title,
  link: `https://${host}/${encodeURIComponent(title).slice(0, 40)}-${minutesAgo}.html`,
  pubDate: new Date(NOW.getTime() - minutesAgo * 60_000).toUTCString(),
  description,
  source: host,
});

describe('text helpers', () => {
  it('decodes numeric and Vietnamese named HTML entities', () => {
    expect(decodeEntities('Ho&agrave;n th&agrave;nh &amp; &#8220;xong&#8221;')).toBe('Hoàn thành & “xong”');
  });

  it('groups headlines about the same event and keeps different events apart', () => {
    const a = {title: 'Quốc hội chốt ngân sách 2027, bố trí 80.400 tỉ đồng cải cách tiền lương'};
    const b = {title: 'Ngân sách 2027: Quốc hội bố trí 80.400 tỉ đồng cho cải cách tiền lương'};
    const c = {title: 'Hà Nội đón đợt rét đậm đầu mùa, giao thông ùn tắc kéo dài'};
    expect(sameStory(a, b)).toBe(true);
    expect(sameStory(a, c)).toBe(false);
  });

  it('does not chain unrelated stories that share boilerplate like "Bộ trưởng"', () => {
    const items = [
      item('Bộ trưởng Nội vụ: Bổ sung ngày nghỉ 27/7 hưởng lương vào dự thảo luật', 'vnexpress.net'),
      item('Bộ trưởng Nội vụ làm rõ ngày nghỉ lễ 27/7 hưởng nguyên lương', 'tuoitre.vn'),
      item('Bộ trưởng Y tế nói về giá thuốc điều trị ung thư tăng mạnh', 'dantri.com.vn'),
      item('Bộ trưởng Giao thông kiểm tra tiến độ cao tốc Bắc Nam', 'thanhnien.vn'),
      ...Array.from({length: 20}, (_, i) => item(`Bộ trưởng phát biểu số ${i} về chủ đề khác nhau ${i * 7}`, 'zingnews.vn')),
    ];
    const same = makeMatcher(items.map((x) => x.title));
    const clusters = clusterItems(items, same);
    const holiday = clusters.find((c) => c.some((x) => x.title.includes('27/7')));
    expect(holiday).toHaveLength(2);
  });
});

describe('classification and gates', () => {
  it('flags crime/accidents and low-value showbiz, and rates mass-impact topics high', () => {
    expect(classify(['Vụ tai nạn khiến cháu bé tử vong, 2 tài xế bị khởi tố']).sensitive).toBe(true);
    expect(classify(['Hoa hậu và ca sĩ ly hôn gây xôn xao']).lowValue).toBe(true);
    const wage = classify(['Quốc hội chốt tăng lương tối thiểu và trợ cấp cho người lao động từ 1/1/2027']);
    expect(wage.reach).toBeGreaterThanOrEqual(20);
    expect(wage.category).toBe('tiền lương – thu nhập');
  });

  it('requires 3 outlets, or 2 outlets plus a Google trend, and a high enough score', () => {
    const base = {outlets: ['a.vn', 'b.vn'], ageHours: 3, lowValue: false, sensitive: false, trend: null, score: 70, breakdown: {reach: 20}};
    expect(gateReasons(base).join()).toMatch(/chưa đủ độ "hot"/);
    expect(gateReasons({...base, trend: {term: 'x', traffic: 500}})).toEqual([]);
    expect(gateReasons({...base, outlets: ['a', 'b', 'c']})).toEqual([]);
    expect(gateReasons({...base, outlets: ['a', 'b', 'c'], sensitive: true})).toHaveLength(1);
    expect(gateReasons({...base, outlets: ['a', 'b', 'c'], sensitive: true}, {allowLegal: true})).toEqual([]);
    expect(gateReasons({...base, outlets: ['a', 'b', 'c'], score: 30})[0]).toMatch(/điểm 30/);
  });

  it('prefers a different category for the second pick unless the gap is large', () => {
    const c = (title, score, category) => ({title, score, category});
    const pool = [c('a', 80, 'lương'), c('b', 78, 'lương'), c('d', 70, 'thời tiết'), c('e', 40, 'giáo dục')];
    expect(pickDiverse(pool, 2).map((p) => p.title)).toEqual(['a', 'd']);
    expect(pickDiverse([c('a', 90, 'lương'), c('b', 85, 'lương'), c('e', 40, 'giáo dục')], 2).map((p) => p.title)).toEqual(['a', 'b']);
  });
});

describe('trends and scoring', () => {
  const rss = `<rss><channel><item><title>mùa đông</title><ht:approx_traffic>1,000+</ht:approx_traffic><pubDate>x</pubDate>
    <ht:news_item><ht:news_item_title>El Nino rất mạnh, dự báo không khí lạnh mùa đông năm nay</ht:news_item_title>
    <ht:news_item_url>https://laodong.vn/a.ldo</ht:news_item_url></ht:news_item></item></channel></rss>`;

  it('parses Google Trends RSS', () => {
    expect(parseTrendsRss(rss)).toEqual([{term: 'mùa đông', traffic: 1000, pubDate: 'x', news: [{title: 'El Nino rất mạnh, dự báo không khí lạnh mùa đông năm nay', url: 'https://laodong.vn/a.ldo', outlet: 'laodong.vn'}]}]);
  });

  it('counts a trend as an extra outlet and adds its points', () => {
    const cluster = clusterItems([item('El Nino rất mạnh, dự báo diễn biến không khí lạnh mùa đông năm nay', 'vnexpress.net', 90)]);
    const scored = scoreCluster(cluster[0], {trends: parseTrendsRss(rss), now: NOW});
    expect(scored.outlets).toEqual(expect.arrayContaining(['vnexpress.net', 'laodong.vn']));
    expect(scored.breakdown.trend).toBe(13);
  });
});

describe('buildQueue', () => {
  it('ranks a multi-outlet money story first, drops crime, one-source and already-made stories', async () => {
    const wage = ['Quốc hội chốt ngân sách 2027, bố trí 80.400 tỉ đồng cải cách tiền lương', 'Ngân sách 2027: Quốc hội bố trí 80.400 tỉ đồng cho cải cách tiền lương', 'Cải cách tiền lương 2027 được bố trí 80.400 tỉ đồng trong ngân sách Quốc hội thông qua'];
    const feeds = {
      'tuoitre.vn': [item(wage[0], 'tuoitre.vn'), item('Vụ án mạng làm một người tử vong, nghi phạm bị bắt giữ', 'tuoitre.vn')],
      'vnexpress.net': [item(wage[1], 'vnexpress.net'), item('Ca sĩ nổi tiếng ly hôn gây xôn xao showbiz', 'vnexpress.net')],
      'dantri.com.vn': [item(wage[2], 'dantri.com.vn'), item('Hà Nội mở thêm tuyến buýt điện số 99 phục vụ cư dân phường Tây Mỗ', 'dantri.com.vn')],
    };
    const fetchItems = async (feed) => feeds[feed.domains[0]] ?? [];
    const run = (history) => buildQueue({count: 2, now: NOW, fetchItems, fetchTrends: async () => [], history, log: () => {}});

    const queue = await run({urls: new Set(), titles: []});
    expect(queue.picks.map((p) => p.title)).toEqual([expect.stringContaining('80.400')]);
    expect(queue.rejected.some((c) => c.reasons.join().includes('hình sự'))).toBe(true);

    const covered = await run({urls: new Set(), titles: [{title: 'Ngân sách 2027 bố trí 80.400 tỉ đồng cho cải cách tiền lương'}]});
    expect(covered.picks).toEqual([]);
  });
});

describe('long-form publish slots', () => {
  it('schedules two videos a day at 12:00 and 20:00 (VN time)', () => {
    const now = new Date('2026-11-09T08:00:00+07:00');
    const taken = [];
    for (let i = 0; i < 4; i += 1) taken.push(nextPublishSlot(taken, {now, ...longSlotOptions({})}).getTime());
    expect(taken.map((t) => new Date(t).toISOString())).toEqual([
      '2026-11-09T05:00:00.000Z', '2026-11-09T13:00:00.000Z', '2026-11-10T05:00:00.000Z', '2026-11-10T13:00:00.000Z',
    ]);
  });
});
