// Same fallback order the production agent uses when a model is unavailable on the proxy.
export const FALLBACK_MODELS = ['gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5'];

export function modelCandidates(primary = process.env.OPENAI_MODEL) {
  return [primary, ...FALLBACK_MODELS].filter((model, index, list) => model && list.indexOf(model) === index);
}

// Tuổi Trẻ publishes "10/30/2026 6:40:00 PM" with no zone; Vietnamese feeds are +07.
export function parsePubDate(pubDate) {
  const text = String(pubDate ?? '').trim();
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::(\d{2}))? ?(AM|PM)?$/i);
  if (us) {
    const [, month, day, year, rawHour, minute, second = '00', meridiem] = us;
    let hour = Number(rawHour) % (meridiem ? 12 : 24);
    if (meridiem?.toUpperCase() === 'PM') hour += 12;
    const pad = (value) => String(value).padStart(2, '0');
    return Date.parse(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${minute}:${second}+07:00`);
  }
  return Date.parse(text.replace(/GMT\+7$/i, '+0700'));
}

export function buildCandidatePool(groupedItems, {perSource = 10, max = 30} = {}) {
  const queues = Object.values(groupedItems).map((items) =>
    [...items]
      .sort((a, b) => (parsePubDate(b.pubDate) || 0) - (parsePubDate(a.pubDate) || 0))
      .slice(0, perSource));
  const pool = [];
  for (let round = 0; round < perSource && pool.length < max; round += 1) {
    for (const queue of queues) {
      if (queue[round] && pool.length < max) pool.push(queue[round]);
    }
  }
  return pool;
}

export function parsePicksJson(text) {
  const match = String(text ?? '').match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const picks = JSON.parse(match[0])?.picks;
    return Array.isArray(picks) ? picks : [];
  } catch {
    return [];
  }
}

export function validatePicks(picks, candidates, {count, maxPerSource = 2}) {
  const chosen = [];
  const used = new Set();
  const perSource = {};
  for (const pick of picks) {
    const index = pick?.index;
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length || used.has(index)) continue;
    const candidate = candidates[index];
    if ((perSource[candidate.sourceId] || 0) >= maxPerSource) continue;
    used.add(index);
    perSource[candidate.sourceId] = (perSource[candidate.sourceId] || 0) + 1;
    chosen.push({...candidate, reason: String(pick.reason ?? '')});
    if (chosen.length >= count) break;
  }
  return chosen;
}

function buildPrompt(candidates, {count, recentTitles, now}) {
  const compact = candidates.map((item, index) => ({
    index,
    source: item.source,
    title: item.title,
    description: String(item.description ?? '').slice(0, 200),
    ageHours: Math.round(((now.getTime() - parsePubDate(item.pubDate)) / 3_600_000) * 10) / 10,
    hasImage: Boolean(item.thumbnail),
  }));
  return `Bạn là biên tập viên kênh tin tức video ngắn VNNews.
Chọn đúng ${count} bài phù hợp nhất để làm video từ danh sách ứng viên.

Tiêu chí (theo dữ liệu kênh: tin dân sinh giữ chân người xem tốt nhất):
- ƯU TIÊN CAO NHẤT tin HOT, gây "hóng biến", đang được bàn tán: vi phạm pháp luật (bắt giữ,
  khởi tố, xét xử, triệt phá đường dây, lừa đảo), tai nạn và sự cố nghiêm trọng, sai phạm của
  cán bộ/doanh nghiệp/người nổi tiếng (tham nhũng, gian lận, hàng giả, thực phẩm bẩn, bị xử phạt),
  xung đột/ẩu đả gây phẫn nộ, vụ việc có diễn biến bất ngờ hoặc tình tiết lạ.
- Khoảng 70% số bài thuộc nhóm trên cùng ĐỜI SỐNG, SỰ CỐ BẤT NGỜ, CHUYỆN LẠ/BÍ ẨN:
  cảnh báo an toàn, câu chuyện khơi lòng trắc ẩn hoặc tò mò.
- Giữa hai tin cùng nhóm, chọn tin có tình tiết cụ thể, kịch tính, quy mô lớn hoặc liên quan
  nhiều người hơn.
- Tối đa khoảng 30% là kinh tế/chính sách/văn hóa, và chỉ khi tin có hệ quả trực tiếp tới túi tiền
  hoặc sinh hoạt của người dân (giá cả, lương, phí, quy định mới áp dụng cho mọi người).
- KHÔNG chọn tin chỉ báo cáo số liệu khô khan: doanh thu, lãi lỗ doanh nghiệp, chỉ số vĩ mô, hội nghị.
- Tin mới, có tiềm năng hình ảnh (ưu tiên hasImage = true).
- KHÔNG chọn 2 bài cùng một sự kiện.
- KHÔNG chọn bài trùng sự kiện với các video đã đăng trong 24 giờ qua.

Video đã đăng 24 giờ qua:
${JSON.stringify(recentTitles)}

Ứng viên:
${JSON.stringify(compact)}

Chỉ trả về JSON, không giải thích thêm:
{"picks":[{"index":<số>,"reason":"<lý do, tối đa 20 từ>"}]}`;
}

export async function createDefaultClient({timeout, maxRetries} = {}) {
  const {default: OpenAI} = await import('openai');
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    ...(timeout !== undefined && {timeout}),
    ...(maxRetries !== undefined && {maxRetries}),
  });
}

export async function rankArticles(candidates, {
  count,
  recentTitles = [],
  now = new Date(),
  client,
  model = process.env.OPENAI_MODEL,
  models = modelCandidates(model),
  onLog = () => {},
} = {}) {
  if (!candidates.length) return [];
  let lastError = null;
  try {
    const openai = client || await createDefaultClient({timeout: 120_000, maxRetries: 0});
    const input = buildPrompt(candidates, {count, recentTitles, now});
    for (const candidateModel of models) {
      try {
        const response = await openai.responses.create({model: candidateModel, input});
        return validatePicks(parsePicksJson(response.output_text), candidates, {count});
      } catch (error) {
        lastError = error;
      }
    }
  } catch (error) {
    lastError = error;
  }
  onLog(`⚠️ Xếp hạng LLM thất bại: ${lastError?.message}. Dùng chọn luân phiên.`);
  return [];
}
