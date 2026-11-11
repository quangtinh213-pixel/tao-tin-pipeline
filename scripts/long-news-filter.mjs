#!/usr/bin/env node
/**
 * Topic filter for the long-form lane (news/long-explainer): picks stories that are HOT
 * (several outlets + Google Trends) and reach MANY people (money, rules, weather, health,
 * education, tech safety), skipping crime, showbiz, sports and advertorials.
 *
 * Usage: node scripts/long-news-filter.mjs [--count 4] [--max-age 36] [--min-score 45]
 *                                          [--allow-legal] [--no-write]
 * Writes data/long-queue.json (ranked picks + rejected top candidates, with the score breakdown).
 * No LLM or API key: RSS feeds + Google Trends RSS (geo=VN) + keyword lexicon.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEFAULT_FEEDS, fetchFeedItems, normalizeUrl} from './auto-news-pipeline.mjs';
import {parsePubDate} from './rank-news.mjs';
import {isLongFormSpec, longSlotOptions, nextPublishSlot, takenLongPublishTimes} from './youtube-upload.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE_FILE = path.join(ROOT, 'data', 'long-queue.json');
const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=VN';
const HOUR = 3_600_000;

export const LONG_FEEDS = [
  ...DEFAULT_FEEDS,
  {source: 'Thanh Niên', id: 'thanhnien', domains: ['thanhnien.vn'], urls: ['https://thanhnien.vn/rss/thoi-su.rss', 'https://thanhnien.vn/rss/home.rss']},
  {source: 'VietnamNet', id: 'vietnamnet', domains: ['vietnamnet.vn'], urls: ['https://vietnamnet.vn/rss/thoi-su.rss']},
  {source: 'Zing News', id: 'zingnews', domains: ['zingnews.vn'], urls: ['https://zingnews.vn/rss/xa-hoi.rss']},
  {source: 'CafeF', id: 'cafef', domains: ['cafef.vn'], urls: ['https://cafef.vn/home.rss']},
  {source: 'VnEconomy', id: 'vneconomy', domains: ['vneconomy.vn'], urls: ['https://vneconomy.vn/tin-moi.rss']},
];

// ─── Text helpers ────────────────────────────────────────────────────────────
const STOP = new Set(('và của là có cho với các những một này đó được trong khi để sẽ đã đang không còn cũng như từ đến về ra vào ' +
  'tại theo sau trước hơn nhất rất nhiều hay hoặc nên thì mà bị do vì nếu lại đều cùng ông bà anh chị người việc ' +
  'năm tháng ngày giờ phút lên xuống mới vừa tiếp tục sao gì nào đâu đây hôm nay qua nhưng mỗi tới còn tin').split(' '));

export const syllables = (text) => String(text ?? '').toLowerCase().normalize('NFC')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/u).filter(Boolean);

/** Content tokens: syllables without stop words, plus adjacent syllable pairs (compound words, names). */
export function tokenize(text) {
  const words = syllables(text);
  const content = words.filter((w) => w.length > 1 && !STOP.has(w));
  const bigrams = [];
  for (let i = 0; i + 1 < words.length; i += 1) {
    if (!STOP.has(words[i]) && !STOP.has(words[i + 1]) && words[i].length > 1 && words[i + 1].length > 1) bigrams.push(`${words[i]}_${words[i + 1]}`);
  }
  return {content: new Set(content), bigrams: new Set(bigrams), numbers: new Set(content.filter((w) => /\d/u.test(w) && w.length >= 2))};
}

const shared = (a, b) => [...a].filter((x) => b.has(x)).length;
const keepOnly = (set, allowed) => (allowed ? new Set([...set].filter((x) => allowed(x))) : set);

const NAMED_ENTITIES = {amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', egrave: 'è', eacute: 'é', ecirc: 'ê', igrave: 'ì', iacute: 'í', ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ',
  ugrave: 'ù', uacute: 'ú', yacute: 'ý', Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Igrave: 'Ì', Iacute: 'Í', Ograve: 'Ò',
  Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ugrave: 'Ù', Uacute: 'Ú', Yacute: 'Ý'};
export const decodeEntities = (text) => String(text ?? '')
  .replace(/&#x([0-9a-f]+);/giu, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/gu, (_, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&([a-z]+);/giu, (whole, name) => NAMED_ENTITIES[name] ?? whole);

/**
 * Same-story test between two headlines. With `rare` (tokens that are not boilerplate such as "Bộ trưởng",
 * "Chủ tịch"), only distinctive words count; without it every word counts (fine for tests, noisy on real feeds).
 */
export function sameStory(a, b, rare = null) {
  const ta = a.tokens ?? tokenize(a.title);
  const tb = b.tokens ?? tokenize(b.title);
  const words = shared(keepOnly(ta.content, rare), keepOnly(tb.content, rare));
  const pairs = shared(keepOnly(ta.bigrams, rare), keepOnly(tb.bigrams, rare));
  const numbers = shared(keepOnly(ta.numbers, rare), keepOnly(tb.numbers, rare));
  if (pairs >= 2 && words >= 3) return true;
  if (pairs >= 1 && numbers >= 1 && words >= 3) return true;
  if (numbers >= 1 && words >= 4) return true;
  return words >= 5 && words / Math.max(1, Math.min(keepOnly(ta.content, rare).size, keepOnly(tb.content, rare).size)) >= 0.6;
}

/** Matcher that ignores words appearing in more than ~1.2% of all headlines (generic titles and common verbs). */
export function makeMatcher(titles) {
  const df = new Map();
  for (const title of titles) {
    const t = tokenize(title);
    for (const word of new Set([...t.content, ...t.bigrams])) df.set(word, (df.get(word) ?? 0) + 1);
  }
  const limit = Math.max(6, Math.round(titles.length * 0.012));
  const rare = (token) => (df.get(token) ?? 0) <= limit;
  return (a, b) => sameStory(a, b, rare);
}

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
};

// ─── Google Trends (VN) ──────────────────────────────────────────────────────
export function parseTrendsRss(xml) {
  const tag = (block, name) => block.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, 'i'))?.[1]?.trim() ?? '';
  return [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, block]) => ({
    term: tag(block, 'title'),
    traffic: Number((tag(block, 'ht:approx_traffic').match(/[\d,]+/)?.[0] ?? '0').replace(/,/g, '')),
    pubDate: tag(block, 'pubDate'),
    news: [...block.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/gi)].map(([, n]) => ({
      title: tag(n, 'ht:news_item_title'),
      url: tag(n, 'ht:news_item_url'),
      outlet: hostOf(tag(n, 'ht:news_item_url')),
    })).filter((n) => n.url),
  })).filter((t) => t.term);
}

// ─── Reach lexicon: who is affected, and how many ────────────────────────────
// weight = how broadly the topic touches ordinary people's money, safety or daily routine.
export const REACH_LEXICON = [
  {category: 'tiền lương – thu nhập', weight: 14, re: /lương|thu nhập|thưởng|trợ cấp|lương hưu|bảo hiểm|bhxh|bhyt|thất nghiệp|việc làm|tuyển dụng|sa thải/iu},
  {category: 'giá cả – tiền tệ', weight: 14, re: /giá (xăng|vàng|điện|nước|gạo|thịt|heo|xe|nhà|đất)|xăng dầu|lãi suất|tỷ giá|lạm phát|ngân hàng|tiết kiệm|vay|nợ xấu|chứng khoán|bitcoin|tiền số|giá vàng/iu},
  {category: 'thuế – phí – quy định', weight: 13, re: /thuế|lệ phí|phí |nghị định|thông tư|luật|có hiệu lực|áp dụng từ|quy định mới|phạt nguội|mức phạt|bằng lái|đăng kiểm|biển số|căn cước/iu},
  {category: 'nhà ở – đất đai', weight: 12, re: /nhà ở|chung cư|sổ đỏ|đất đai|bảng giá đất|bất động sản|tiền thuê|giải tỏa|đền bù/iu},
  {category: 'thiên tai – thời tiết', weight: 12, re: /bão|áp thấp|lũ|ngập|sạt lở|rét|nắng nóng|hạn mặn|động đất|không khí lạnh|el nino|la nina|mưa lớn/iu},
  {category: 'sức khỏe – thực phẩm', weight: 12, re: /dịch|bệnh|vắc ?xin|vaccine|ngộ độc|thực phẩm|bệnh viện|thuốc|viện phí|cúm|sốt xuất huyết|covid|ung thư/iu},
  {category: 'giáo dục', weight: 11, re: /học phí|tuyển sinh|kỳ thi|thi tốt nghiệp|sách giáo khoa|giáo viên|học sinh|đại học|chương trình mới/iu},
  {category: 'giao thông – hạ tầng', weight: 10, re: /giao thông|cao tốc|metro|đường sắt|sân bay|vé tàu|vé máy bay|kẹt xe|ùn tắc|điện|mất điện|nước sạch/iu},
  {category: 'công nghệ – an ninh mạng', weight: 10, re: /lừa đảo|mạo danh|an ninh mạng|dữ liệu cá nhân|trí tuệ nhân tạo|\bai\b|chatgpt|iphone|điện thoại|ứng dụng|tài khoản|sim |mã otp|định danh/iu},
  {category: 'quốc tế tác động Việt Nam', weight: 9, re: /thuế quan|xuất khẩu|nhập khẩu|fed|kinh tế mỹ|trung quốc|hiệp định|đầu tư nước ngoài|chip|dầu thô|chuỗi cung ứng/iu},
  {category: 'chính sách lớn', weight: 9, re: /quốc hội|chính phủ|thủ tướng|bộ chính trị|nghị quyết|sáp nhập|cải cách|tăng trưởng|gdp|ngân sách/iu},
];
const MASS_REACH = /triệu người|hàng triệu|cả nước|toàn quốc|người dân|mọi người|hộ gia đình|người lao động|người tiêu dùng|63 tỉnh|34 tỉnh/iu;
const EXPLAINER = /vì sao|tại sao|như thế nào|ra sao|liệu|bao nhiêu|có phải|thay đổi|hệ quả|tác động|ảnh hưởng|điều chỉnh|từ (ngày )?\d|hiệu lực/iu;

// Long videos stay factual explainers: crime and graphic stories belong to Shorts, not here.
const SENSITIVE = /tử vong|thi thể|giết|sát hại|hiếp|xâm hại|tự tử|nổ súng|chém|đâm|bạo hành|ma túy|bị bắt|khởi tố|truy nã|cướp|trộm|tai nạn|đuối nước|cháy|nổ |bắt giữ|án mạng/iu;
const LOW_VALUE = /con giáp|tử vi|khuyến mãi|ưu đãi|ra mắt xe|giá xe|hoa hậu|ca sĩ|diễn viên|sao việt|showbiz|ngoại hình|bóng đá|v-league|hlv|cầu thủ|xổ số|kết quả|lịch thi đấu|\bpr\b|quảng cáo|hot girl|đám cưới|ly hôn|scandal/iu;

export function classify(texts, descriptions = '') {
  const text = texts.join(' | ');
  const matches = REACH_LEXICON.filter((entry) => entry.re.test(text));
  const sorted = [...matches].sort((a, b) => b.weight - a.weight);
  const base = sorted.slice(0, 2).reduce((sum, entry) => sum + entry.weight, 0);
  const mass = MASS_REACH.test(`${text} ${descriptions}`) ? 4 : 0;
  return {
    category: sorted[0]?.category ?? 'khác',
    reach: Math.min(25, base + mass),
    labels: sorted.map((entry) => entry.category),
    sensitive: SENSITIVE.test(texts.slice(0, 2).join(' ')),
    lowValue: LOW_VALUE.test(texts.slice(0, 2).join(' ')),
    explainer: EXPLAINER.test(`${text} ${descriptions}`),
  };
}

// ─── Clustering and scoring ──────────────────────────────────────────────────
/** Greedy seed clustering: an item joins a cluster only if it matches the seed or two members, so chains cannot merge unrelated stories. */
export function clusterItems(items, same = sameStory) {
  const prepared = items.map((item) => ({...item, tokens: tokenize(item.title)}));
  const clusters = [];
  for (const item of prepared) {
    const home = clusters.find((cluster) => same(item, cluster[0]) || cluster.filter((member) => same(item, member)).length >= 2);
    if (home) home.push(item);
    else clusters.push([item]);
  }
  return clusters;
}

const outletScore = (n) => ({0: 0, 1: 0, 2: 16, 3: 28, 4: 36}[Math.min(n, 5)] ?? 40);
const trendScore = (traffic) => (traffic >= 10000 ? 20 : traffic >= 5000 ? 17 : traffic >= 1000 ? 13 : traffic >= 500 ? 10 : traffic >= 100 ? 7 : 0);

export function matchTrend(cluster, trends, same = sameStory) {
  const urls = new Set(cluster.map((item) => normalizeUrl(item.link)));
  const clusterWords = new Set(cluster.flatMap((item) => [...item.tokens.content]));
  let best = null;
  for (const trend of trends) {
    const viaUrl = trend.news.some((n) => urls.has(normalizeUrl(n.url)));
    const termWords = syllables(trend.term).filter((w) => !STOP.has(w));
    const viaTerm = termWords.length >= 2 && termWords.every((w) => clusterWords.has(w));
    const viaNews = trend.news.some((n) => cluster.some((item) => same({title: n.title}, item)));
    if ((viaUrl || viaTerm || viaNews) && (!best || trend.traffic > best.traffic)) best = trend;
  }
  return best;
}

export function scoreCluster(cluster, {trends = [], now = new Date(), maxAgeHours = 36, same = sameStory} = {}) {
  const fresh = cluster.filter((item) => {
    const t = parsePubDate(item.pubDate);
    return Number.isFinite(t) && now.getTime() - t <= maxAgeHours * HOUR && t - now.getTime() <= 10 * 60_000;
  });
  const trend = matchTrend(cluster, trends, same);
  const outlets = new Set([...fresh.map((item) => hostOf(item.link)), ...(trend ? trend.news.map((n) => n.outlet) : [])].filter(Boolean));
  const newest = Math.max(...fresh.map((item) => parsePubDate(item.pubDate)), 0);
  const ageHours = newest ? (now.getTime() - newest) / HOUR : Infinity;
  const ranked = [...cluster].sort((a, b) => b.title.length - a.title.length);
  const kind = classify([ranked[0].title, ...ranked.slice(1, 4).map((i) => i.title)], ranked.map((i) => i.description).join(' '));
  const breakdown = {
    coverage: outletScore(outlets.size),
    trend: trend ? trendScore(trend.traffic) : 0,
    reach: kind.reach,
    explainer: kind.explainer ? 10 : 0,
    freshness: ageHours <= 6 ? 5 : ageHours <= 18 ? 3 : ageHours <= 36 ? 1 : 0,
  };
  return {
    title: ranked[0].title,
    score: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
    category: kind.category,
    labels: kind.labels,
    sensitive: kind.sensitive,
    lowValue: kind.lowValue,
    outlets: [...outlets],
    ageHours: Math.round(ageHours * 10) / 10,
    trend: trend ? {term: trend.term, traffic: trend.traffic} : null,
    items: fresh.length ? fresh : cluster,
    extraSources: trend ? trend.news.filter((n) => !cluster.some((item) => hostOf(item.link) === n.outlet)) : [],
  };
}

/** Gate reasons that disqualify a story from a long video, regardless of score. */
export function gateReasons(candidate, {minScore = 45, allowLegal = false} = {}) {
  const reasons = [];
  if (candidate.outlets.length < 3 && !(candidate.outlets.length >= 2 && candidate.trend)) reasons.push('chưa đủ độ "hot": cần ≥3 báo, hoặc 2 báo + xu hướng Google');
  if (candidate.ageHours > 36) reasons.push('tin quá cũ');
  if (candidate.lowValue) reasons.push('giải trí/thể thao/quảng cáo');
  if (candidate.sensitive && !allowLegal) reasons.push('tin hình sự/tai nạn, để cho Shorts');
  if (candidate.breakdown.reach < 12) reasons.push('ít người bị ảnh hưởng trực tiếp');
  if (candidate.score < minScore) reasons.push(`điểm ${candidate.score} < ${minScore}`);
  return reasons;
}

/** Top picks with category variety: a repeat category needs a clearly higher score than the best other option. */
export function pickDiverse(qualified, count, {margin = 12} = {}) {
  const sorted = [...qualified].sort((a, b) => b.score - a.score);
  const picks = [];
  while (picks.length < count && sorted.length) {
    const used = new Set(picks.map((p) => p.category));
    const fresh = sorted.find((c) => !used.has(c.category));
    const top = sorted[0];
    const choice = fresh && top.score - fresh.score <= margin ? fresh : top;
    picks.push(choice);
    sorted.splice(sorted.indexOf(choice), 1);
  }
  return picks;
}

// ─── History: never remake a story already covered by a long video ──────────
export function loadLongHistory(videosDir = path.join(ROOT, 'videos')) {
  const urls = new Set();
  const titles = [];
  if (!fs.existsSync(videosDir)) return {urls, titles};
  for (const entry of fs.readdirSync(videosDir, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(videosDir, entry.name);
    try {
      // A run still in progress has template.txt + context.txt but no spec yet: count it too.
      const template = fs.existsSync(path.join(dir, 'template.txt')) ? fs.readFileSync(path.join(dir, 'template.txt'), 'utf8').trim() : '';
      if (template === 'news/long-explainer' && fs.existsSync(path.join(dir, 'context.txt'))) {
        for (const url of fs.readFileSync(path.join(dir, 'context.txt'), 'utf8').match(/https?:\/\/[^\s"'<>]+/g) ?? []) urls.add(normalizeUrl(url));
      }
      const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
      if (!isLongFormSpec(spec)) continue;
      titles.push({title: spec.video.title});
      (spec.sources ?? []).forEach((source) => urls.add(normalizeUrl(source.url)));
    } catch {
      // Not a long-form render yet
    }
  }
  return {urls, titles};
}

export function isAlreadyCovered(candidate, history, same = sameStory) {
  return candidate.items.some((item) => history.urls.has(normalizeUrl(item.link)))
    || history.titles.some((past) => same({title: candidate.title}, past));
}

// ─── Run ─────────────────────────────────────────────────────────────────────
export async function buildQueue({count = 4, maxAgeHours = 36, minScore = 45, allowLegal = false, now = new Date(), fetchItems = fetchFeedItems, fetchTrends, history = loadLongHistory(), log = console.error} = {}) {
  const trends = await (fetchTrends ?? (async () => {
    try {
      const response = await fetch(TRENDS_URL, {headers: {'User-Agent': 'Mozilla/5.0'}});
      return response.ok ? parseTrendsRss(await response.text()) : [];
    } catch {
      return [];
    }
  }))();
  const perFeed = await Promise.all(LONG_FEEDS.map((feed) => fetchItems(feed)));
  const items = perFeed.flat().map((item) => ({...item, title: decodeEntities(item.title), description: decodeEntities(item.description)})).filter((item) => {
    const t = parsePubDate(item.pubDate);
    return Number.isFinite(t) && now.getTime() - t <= maxAgeHours * HOUR;
  });
  log(`Đã đọc ${items.length} bài trong ${maxAgeHours}h từ ${LONG_FEEDS.length} nguồn, ${trends.length} xu hướng Google.`);

  const same = makeMatcher([...items.map((item) => item.title), ...trends.flatMap((t) => t.news.map((n) => n.title)), ...history.titles.map((h) => h.title)]);
  const scored = clusterItems(items, same).map((cluster) => scoreCluster(cluster, {trends, now, maxAgeHours, same}));
  const evaluated = scored.map((candidate) => {
    const reasons = gateReasons(candidate, {minScore, allowLegal});
    if (isAlreadyCovered(candidate, history, same)) reasons.push('đã có video dài về sự kiện này');
    return {...candidate, reasons};
  }).sort((a, b) => b.score - a.score);

  const picks = pickDiverse(evaluated.filter((c) => !c.reasons.length), count);
  return {
    generatedAt: now.toISOString(),
    settings: {count, maxAgeHours, minScore, allowLegal},
    stats: {articles: items.length, clusters: scored.length, trends: trends.length, qualified: evaluated.filter((c) => !c.reasons.length).length},
    picks,
    rejected: evaluated.filter((c) => c.reasons.length).slice(0, 15),
  };
}

const toRecord = (candidate, rank, slot = null) => ({
  rank,
  title: candidate.title,
  score: candidate.score,
  breakdown: candidate.breakdown,
  category: candidate.category,
  outlets: candidate.outlets,
  trend: candidate.trend,
  ageHours: candidate.ageHours,
  publishSlot: slot,
  sources: [
    ...candidate.items.map((item) => ({outlet: hostOf(item.link), url: item.link, title: item.title, pubDate: item.pubDate})),
    ...candidate.extraSources.map((n) => ({outlet: n.outlet, url: n.url, title: n.title, pubDate: null})),
  ],
  reasons: candidate.reasons,
});

function main() {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 ? Number(args[i + 1]) : fallback;
  };
  return buildQueue({count: flag('--count', 4), maxAgeHours: flag('--max-age', 36), minScore: flag('--min-score', 45), allowLegal: args.includes('--allow-legal')})
    .then((queue) => {
      const slots = [];
      const taken = takenLongPublishTimes();
      for (let i = 0; i < queue.picks.length; i += 1) {
        const slot = nextPublishSlot([...taken, ...slots.map((s) => s.getTime())], longSlotOptions());
        slots.push(slot);
      }
      const out = {...queue, picks: queue.picks.map((c, i) => toRecord(c, i + 1, slots[i].toISOString())), rejected: queue.rejected.map((c, i) => toRecord(c, i + 1))};
      if (!args.includes('--no-write')) {
        fs.mkdirSync(path.dirname(QUEUE_FILE), {recursive: true});
        fs.writeFileSync(QUEUE_FILE, `${JSON.stringify(out, null, 2)}\n`);
      }
      console.log(`\nHàng đợi video dài (${out.stats.qualified} tin đạt chuẩn / ${out.stats.clusters} chủ đề):`);
      out.picks.forEach((p) => console.log(`${p.rank}. [${p.score}] ${p.title}\n   ${p.category} · ${p.outlets.length} báo${p.trend ? ` · trend "${p.trend.term}" ${p.trend.traffic}+` : ''} · đăng ${new Date(p.publishSlot).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`));
      if (!out.picks.length) console.log('(không có tin nào đạt chuẩn; hạ --min-score hoặc đợi tin mới)');
      console.log('\nBị loại (điểm cao nhất):');
      out.rejected.slice(0, 8).forEach((p) => console.log(`- [${p.score}] ${p.title.slice(0, 80)} → ${p.reasons.join('; ')}`));
      if (!args.includes('--no-write')) console.log(`\nĐã ghi ${path.relative(ROOT, QUEUE_FILE)}`);
    });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Lỗi: ${error.message}`);
    process.exit(1);
  });
}
