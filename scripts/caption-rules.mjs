const SECTION_ICONS = new Set(['🔴', '⚠️', '📌']);
const REQUIRED_HASHTAG = '#VnNews213';

const HOT_KEYWORDS = [
  'nong',
  'chay',
  'no',
  'tai nan',
  'tu vong',
  'thi the',
  'nuoc cuon',
  'mat tich',
  'bat',
  'tam giu',
  'khoi to',
  'lua dao',
  'ma tuy',
  'cong an',
  'canh bao',
  'cap cuu',
  'cuu ho',
  'cuu nan',
  'dieu tra',
  'kham nghiem',
  'toan an',
  'tuyen an',
  'thuong vong',
  'vu viec',
];

const POLICY_KEYWORDS = [
  'nghi dinh',
  'quy dinh',
  'chinh sach',
  'muc phat',
  'gia',
  'thi truong',
  'viec lam',
  'giao thong',
  'dich vu cong',
  'giao duc',
  'y te',
  'doi song',
  'luong',
  'thue',
  'bao hiem',
  'ho tro',
];

const HOT_HASHTAG_KEYWORDS = [
  ['phap luat', '#phapluat'],
  ['khoi to', '#phapluat'],
  ['bat tam giu', '#phapluat'],
  ['cong an', '#phapluat'],
  ['lua dao', '#phapluat'],
  ['ma tuy', '#phapluat'],
  ['doi hiep si', '#phapluat'],
  ['doi hiep', '#phapluat'],
  ['giai cuu', '#phapluat'],
  ['tuyen an', '#phapluat'],
  ['bi phat', '#phapluat'],
  ['nam tu', '#phapluat'],
  ['chay', '#canhbao'],
  ['no', '#canhbao'],
  ['tai nan', '#canhbao'],
  ['cay do', '#canhbao'],
  ['nuoc cuon', '#canhbao'],
  ['canh bao', '#canhbao'],
  ['cuu ho', '#canhbao'],
  ['mat tich', '#canhbao'],
  ['thi the', '#canhbao'],
  ['tu vong', '#canhbao'],
];

const SEO_PHRASES = [
  ['tp hcm', '#tphcm'],
  ['tphcm', '#tphcm'],
  ['ha noi', '#hanoi'],
  ['ninh binh', '#ninhbinh'],
  ['quang ninh', '#quangninh'],
  ['kim son', '#kimson'],
  ['cay do', '#caydo'],
  ['xe buyt', '#xebuyt'],
  ['doi hiep si', '#doihiepsi'],
  ['doi hiep', '#doihiep'],
  ['giai cuu', '#giaicuu'],
  ['nam sinh', '#namsinh'],
  ['nuoc cuon', '#nuoccuon'],
  ['kham xet', '#khamxet'],
  ['ma tuy', '#matuy'],
  ['tuyen an', '#tuyenan'],
  ['hai phong', '#haiphong'],
  ['da nang', '#danang'],
  ['ngan hang', '#nganhang'],
  ['giao vien', '#giaovien'],
  ['hoc vien', '#hocvien'],
  ['o to', '#oto'],
  ['nam thanh nien', '#namthanhnien'],
  ['cay lon', '#caylon'],
  ['hung khi', '#hunghi'],
  ['chem nham', '#chemnham'],
  ['mang ket', '#macket'],
  ['roi xuong cong', '#roixuongcong'],
  ['thi the', '#thithe'],
  ['cho kim son', '#chokimson'],
  ['cong an', '#congan'],
  ['co quan chuc nang', '#coquanchucnang'],
  ['benh vien', '#benhvien'],
  ['nguoi dan', '#nguoidan'],
  ['mua lon', '#mualon'],
  ['ngap lut', '#ngaplut'],
  ['tim kiem', '#timkiem'],
  ['cuu nan', '#cuunan'],
];

// Câu mẫu dùng chung mọi tin; mô tả Facebook lọc bỏ chúng (scripts/facebook-reel-upload.mjs).
const GENERIC_NOTES = {
  hot: '⚠️ Người xem nên ưu tiên thông tin chính thống và tránh suy đoán khi vụ việc chưa có kết luận.',
  policy: '📌 Điều đáng nhớ là mỗi thay đổi cần được đối chiếu với thông báo chính thức trước khi áp dụng.',
};
const GENERIC_EXPANSIONS = {
  hot: 'Thông tin đang được theo dõi thêm; các chi tiết mới chỉ nên được chia sẻ khi có xác nhận từ nguồn chính thống.',
  policy: 'Người xem nên đọc kỹ nguồn gốc thông tin và cập nhật thay đổi từ cơ quan có thẩm quyền để tránh hiểu nhầm.',
};
const GENERIC_CTAS = {
  hot: 'Mọi người nhìn nhận thế nào về diễn biến này và cách xử lý tiếp theo?',
  policy: 'Anh chị em nghĩ thay đổi này sẽ tác động thế nào đến đời sống hằng ngày?',
};
export const GENERIC_CAPTION_NOTES = [...Object.values(GENERIC_NOTES), ...Object.values(GENERIC_EXPANSIONS)];
export const GENERIC_CAPTION_CTAS = Object.values(GENERIC_CTAS);

const DISCOVERY_HASHTAGS = {
  hot: ['#tintuc', '#tinmoi', '#capnhat', '#tintuc24h'],
  policy: ['#thoisu', '#capnhat', '#tintuc24h', '#thongtin'],
};

const FALLBACK_HASHTAGS = {
  hot: ['#tintucmoi', '#thongtinmoi', '#tintucvietnam', '#tinmoi24h'],
  policy: ['#tintucmoi', '#thongtinmoi', '#capnhat24h', '#tintucvietnam'],
};

const POLICY_HASHTAG_KEYWORDS = [
  ['nghi dinh', '#chinhsach'],
  ['quy dinh', '#chinhsach'],
  ['chinh sach', '#chinhsach'],
  ['muc phat', '#chinhsach'],
  ['giao thong', '#chinhsach'],
  ['dich vu cong', '#chinhsach'],
  ['thue', '#chinhsach'],
  ['bao hiem', '#chinhsach'],
  ['ho tro', '#chinhsach'],
  ['gia', '#kinhte'],
  ['thi truong', '#kinhte'],
  ['viec lam', '#kinhte'],
  ['luong', '#kinhte'],
  ['giao duc', '#doisong'],
  ['y te', '#doisong'],
  ['doi song', '#doisong'],
];

const ATTRIBUTION_PATTERNS = [
  /\btheo\b/iu,
  /cơ quan chức năng/iu,
  /đang được điều tra/iu,
  /đang làm rõ/iu,
  /chưa có thông tin khẳng định/iu,
];

const BINARY_CTA_PATTERN = /\b(?:bạn|mọi người|anh chị em)\b[^?\n]{0,100}\b(?:có\s+đồng\s+ý|thấy\s+(?:đúng|sai)|đồng\s+ý)\s*(?:không)?\s*\?\s*$/iu;

function stripVietnameseAccents(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd');
}

function normalizeForSearch(value) {
  return stripVietnameseAccents(value).toLocaleLowerCase('vi');
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}

function ensureSentence(value) {
  const text = cleanText(value);
  if (!text) return '';
  return /[.!?…]$/u.test(text) ? text : `${text}.`;
}

function firstSentence(value) {
  const text = cleanText(value);
  if (!text) return '';
  const match = text.match(/^.*?[.!?](?:\s|$)/u);
  return cleanText(match ? match[0] : text);
}

function getScriptText(segment) {
  if (typeof segment === 'string') return cleanText(segment);
  return cleanText(segment?.text);
}

function normalizedStoryText({title = '', hook = '', scriptText = ''} = {}) {
  return normalizeForSearch([title, hook, scriptText].filter(Boolean).join(' '));
}

function containsKeyword(text, keyword) {
  const escaped = keyword
    .replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
    .replace(/\s+/gu, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'u').test(text);
}

export function countCaptionWords(caption) {
  if (typeof caption !== 'string') return 0;
  return caption
    .trim()
    .split(/\s+/u)
    .filter((token) => token && !SECTION_ICONS.has(token))
    .length;
}

export function classifyCaptionStory({title = '', hook = '', scriptText = ''} = {}) {
  const text = normalizedStoryText({title, hook, scriptText});
  const hotScore = HOT_KEYWORDS.reduce((score, keyword) => (
    containsKeyword(text, keyword) ? score + 1 : score
  ), 0);
  // "lực lượng" is common in news copy and is not a reference to wages.
  const policyText = text.replace(/\bluc\s+luong\b/gu, ' ');
  const policyScore = POLICY_KEYWORDS.reduce((score, keyword) => (
    containsKeyword(policyText, keyword) ? score + 1 : score
  ), 0);

  return hotScore >= policyScore ? 'hot' : 'policy';
}

export function hasRequiredCaptionHashtags(caption) {
  return typeof caption === 'string' && new RegExp(`(^|\\s)${REQUIRED_HASHTAG}(?=\\s|$)`, 'u').test(caption);
}

function appendUniqueHashtag(hashtags, hashtag) {
  if (hashtag && !hashtags.includes(hashtag)) hashtags.push(hashtag);
}

function deriveTopicHashtags(searchTitle, category) {
  const hashtags = [];
  const matches = category === 'hot' ? HOT_HASHTAG_KEYWORDS : POLICY_HASHTAG_KEYWORDS;
  for (const [keyword, hashtag] of matches) {
    if (containsKeyword(searchTitle, keyword)) appendUniqueHashtag(hashtags, hashtag);
  }

  if (category === 'hot') {
    appendUniqueHashtag(hashtags, '#xahoi');
  } else if (hashtags.length === 0) {
    appendUniqueHashtag(hashtags, '#chinhsach');
  }

  return hashtags;
}

function extractCaptionHashtags(caption) {
  return typeof caption === 'string' ? caption.match(/#[\p{L}\p{N}_-]+/gu) || [] : [];
}

function deriveHashtags(title, category, context = title) {
  const searchTitle = normalizeForSearch(title);
  const searchContext = normalizeForSearch(context);
  const hashtags = [REQUIRED_HASHTAG, ...(DISCOVERY_HASHTAGS[category] || DISCOVERY_HASHTAGS.hot)];

  for (const hashtag of deriveTopicHashtags(searchContext, category)) {
    appendUniqueHashtag(hashtags, hashtag);
  }

  for (const [keyword, hashtag] of SEO_PHRASES) {
    if (containsKeyword(searchTitle, keyword)) appendUniqueHashtag(hashtags, hashtag);
    if (hashtags.length >= 15) break;
  }

  for (const hashtag of FALLBACK_HASHTAGS[category] || FALLBACK_HASHTAGS.hot) {
    appendUniqueHashtag(hashtags, hashtag);
    if (hashtags.length >= 10) break;
  }

  return hashtags.slice(0, 15).join(' ');
}

function normalizeSegments(scriptSegments) {
  return (Array.isArray(scriptSegments) ? scriptSegments : [])
    .map(getScriptText)
    .filter(Boolean);
}

function chooseContentSegments(segments) {
  if (segments.length <= 3) return segments;
  const first = segments[0];
  const last = segments.at(-1);
  const middle = segments.slice(1, -1).slice(0, 2);
  return [first, ...middle, last];
}

function removeDuplicateStart(text, duplicate) {
  if (!text || !duplicate) return text;
  const left = normalizeForSearch(text).replace(/[.!?…]+$/gu, '');
  const right = normalizeForSearch(duplicate).replace(/[.!?…]+$/gu, '');
  return left === right ? '' : text;
}

function captionWithoutHashtags(caption) {
  return caption.replace(/#[\p{L}\p{N}_-]+/gu, '').replace(/[ \t]+\n/gu, '\n').trim();
}

function appendSafeExpansion(lines, category, currentWords) {
  if (currentWords >= 100) return lines;
  const expansion = GENERIC_EXPANSIONS[category === 'hot' ? 'hot' : 'policy'];
  lines.splice(Math.max(1, lines.length - 2), 0, expansion);
  return lines;
}

function truncateCaptionLine(line, wordBudget) {
  if (wordBudget <= 0) return '';
  if (countCaptionWords(line) <= wordBudget) return line;
  const words = line.trim().split(/\s+/u).slice(0, wordBudget);
  return `${words.join(' ')}…`;
}

function trimToWordLimit(lines, maxWords) {
  const cleanLines = lines.filter(Boolean);
  const caption = cleanLines.join('\n\n');
  if (countCaptionWords(caption) <= maxWords) return caption;

  const hook = cleanLines[0] || '';
  const cta = cleanLines.at(-2) || '';
  const hashtags = cleanLines.at(-1) || '';
  const content = cleanLines.slice(1, -2);
  const details = content.slice(0, -1);
  const warning = content.at(-1) || '';
  const candidates = [];
  if (details[0]) candidates.push(details[0]);
  if (details.length > 1 && details.at(-1) !== details[0]) candidates.push(details.at(-1));
  if (warning) candidates.push(warning);
  candidates.push(...details.slice(1, -1));

  let remaining = maxWords - countCaptionWords([hook, cta, hashtags].join('\n\n'));
  const keptContent = [];
  for (const candidate of candidates) {
    if (remaining <= 0) break;
    const candidateWords = countCaptionWords(candidate);
    const selected = truncateCaptionLine(candidate, remaining);
    if (selected) keptContent.push(selected);
    remaining -= Math.min(candidateWords, remaining);
  }

  return [hook, ...keptContent, cta, hashtags].filter(Boolean).join('\n\n');
}

export function buildCaption({
  title = '',
  date = '',
  publisher = '',
  scriptSegments = [],
  planHook = '',
  planEnding = '',
} = {}) {
  const segments = normalizeSegments(scriptSegments);
  const scriptText = segments.join(' ');
  const category = classifyCaptionStory({title, hook: planHook, scriptText});
  const titleText = cleanText(title) || firstSentence(planHook) || 'Thông tin đáng chú ý hôm nay';
  const hookLabel = category === 'hot' ? '🔴 NÓNG:' : '📌 ĐÁNG CHÚ Ý:';
  const hook = ensureSentence(`${hookLabel} ${titleText}`);
  const verifiedSegments = chooseContentSegments(segments);
  const source = cleanText(publisher) || 'thông tin được cung cấp';
  const dateText = cleanText(date);
  const first = verifiedSegments[0] || cleanText(planHook) || titleText;
  const last = verifiedSegments.at(-1) || cleanText(planEnding) || first;
  const middle = verifiedSegments.slice(1, -1);
  const firstWithoutDuplicate = removeDuplicateStart(first, planHook);
  const firstDetail = firstWithoutDuplicate || first;
  const details = [
    `Theo ${source}${dateText ? `, thông tin được ghi nhận ngày ${dateText}` : ''}: ${ensureSentence(firstDetail)}`,
    ...middle.slice(0, 2).map((segment) => ensureSentence(segment)),
    ensureSentence(removeDuplicateStart(last, firstDetail) || last),
  ].filter(Boolean);

  const contentLines = details.slice(0, 4);
  if (category === 'hot') {
    contentLines.push(GENERIC_NOTES.hot);
  } else {
    contentLines.push(GENERIC_NOTES.policy);
  }

  const cta = GENERIC_CTAS[category === 'hot' ? 'hot' : 'policy'];
  const hashtagSource = [titleText, planHook, scriptText].filter(Boolean).join(' ');
  const lines = [hook, ...contentLines, cta, deriveHashtags(titleText, category, hashtagSource)];
  appendSafeExpansion(lines, category, countCaptionWords(lines.join('\n\n')));
  return trimToWordLimit(lines, 180);
}

export function validateCaption(caption, {title = '', hook = '', scriptText = '', publisher = ''} = {}) {
  const value = typeof caption === 'string' ? caption.trim() : '';
  const wordCount = countCaptionWords(value);
  const category = classifyCaptionStory({title, hook, scriptText});
  const errors = [];
  const hashtags = extractCaptionHashtags(value);
  const normalizedHashtags = hashtags.map((hashtag) => normalizeForSearch(hashtag));
  const requiredDiscovery = DISCOVERY_HASHTAGS[category] || DISCOVERY_HASHTAGS.hot;
  const expectedTopic = deriveTopicHashtags(normalizedStoryText({title, hook, scriptText}), category);

  if (wordCount < 100 || wordCount > 180) errors.push('Caption phải có 100–180 từ.');
  if (!hasRequiredCaptionHashtags(value)) errors.push('Caption phải có #VnNews213.');
  if (hashtags.length < 10 || hashtags.length > 15) errors.push('Caption phải có 10–15 hashtag SEO.');
  if (new Set(normalizedHashtags).size !== normalizedHashtags.length) errors.push('Caption không được lặp hashtag.');
  if (requiredDiscovery.some((hashtag) => !hashtags.includes(hashtag))) {
    errors.push('Caption thiếu hashtag nền tảng SEO bắt buộc.');
  }
  if (expectedTopic.some((hashtag) => !hashtags.includes(hashtag))) {
    errors.push('Caption phải có hashtag nhóm tin phù hợp.');
  }
  if (!/^[🔴⚠️📌]/u.test(value)) errors.push('Caption phải có icon mở đầu.');

  const withoutHashtags = captionWithoutHashtags(value);
  if (!/\?\s*$/u.test(withoutHashtags)) errors.push('CTA phải là câu hỏi mở.');
  if (/^(?:xin chào|chào mọi người|hello)\b/iu.test(value.replace(/^[🔴⚠️📌]\s*/u, ''))) {
    errors.push('Caption không được mở đầu bằng lời chào.');
  }
  if (BINARY_CTA_PATTERN.test(withoutHashtags)) {
    errors.push('CTA không được là câu hỏi đóng dạng Yes/No.');
  }

  if (category === 'hot' && !ATTRIBUTION_PATTERNS.some((pattern) => pattern.test(value))) {
    errors.push('Tin nóng/pháp luật cần có câu dẫn nguồn hoặc trạng thái xác minh.');
  }

  return {valid: errors.length === 0, errors, wordCount, category, publisher: cleanText(publisher) || null};
}
