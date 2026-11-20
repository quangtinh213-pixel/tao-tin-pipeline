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
- ƯU TIÊN CAO NHẤT tin HOT, gây "hóng biến", đang được bàn tán:
  + Cứu hộ cứu nạn, người mất tích, tình huống sinh tử (nhóm đạt view cao nhất kênh).
  + Thiên tai, thời tiết cực đoan/bất thường như rét đậm, bão lũ (nhóm giữ chân APV cao nhất kênh >100%).
  + Vi phạm pháp luật: bắt giữ, khởi tố, xét xử, triệt phá đường dây, lừa đảo, sai phạm cán bộ cấp cao.
  + Tai nạn nghiêm trọng có tình tiết bất ngờ, sự cố lạ khơi gợi lòng trắc ẩn hoặc cảnh giác.
- Khoảng 70% số bài thuộc nhóm trên cùng ĐỜI SỐNG, SỰ CỐ BẤT NGỜ, CHUYỆN LẠ/BÍ ẨN.
- Tối đa khoảng 30% là giá vàng hôm nay, tiền tệ, đền bù, chính sách sát sườn túi tiền người dân.
- TUYỆT ĐỐI KHÔNG chọn tin chỉ báo cáo số liệu khô khan: doanh thu, lãi lỗ doanh nghiệp, chỉ số vĩ mô, hội nghị.
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

export async function rankWithGemini(candidates, {count, recentTitles = [], now = new Date(), onLog = () => {}} = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  try {
    const {GoogleGenAI} = await import('@google/genai');
    const ai = new GoogleGenAI({apiKey});
    const input = buildPrompt(candidates, {count, recentTitles, now});
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: input,
        });
        const text = response.text ?? '';
        const picks = parsePicksJson(text);
        if (picks.length) {
          const validated = validatePicks(picks, candidates, {count});
          if (validated.length) return validated;
        }
      } catch (err) {
        // Try next model if one is unavailable
      }
    }
  } catch (err) {
    onLog(`⚠️ Xếp hạng Gemini thất bại: ${err.message}`);
  }
  return null;
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

  // When client is explicitly provided (e.g. unit tests with mock client)
  if (client) {
    try {
      const input = buildPrompt(candidates, {count, recentTitles, now});
      for (const candidateModel of models) {
        try {
          const response = await client.responses.create({model: candidateModel, input});
          return validatePicks(parsePicksJson(response.output_text), candidates, {count});
        } catch (error) {
          lastError = error;
        }
      }
    } catch (error) {
      lastError = error;
    }
    if (lastError) onLog(`Connection error.`);
    return [];
  }

  // By default, block external LLM APIs and use `agy` CLI instead.
  if (process.env.ALLOW_LLM_API !== 'true') {
    const {rankArticlesWithAgy} = await import('./agy-runner.mjs');
    const agyPicks = await rankArticlesWithAgy(candidates, {count, recentTitles, now, onLog});
    if (agyPicks?.length) {
      onLog(`✅ agy đã xếp hạng thành công ${agyPicks.length} bài.`);
      return agyPicks;
    }
    onLog(`⚠️ Xếp hạng bằng agy không trả về kết quả. Dùng chọn luân phiên.`);
    return [];
  }

  // Primary ranker: Gemini AI (only when ALLOW_LLM_API=true)
  if (process.env.GEMINI_API_KEY) {
    const geminiPicks = await rankWithGemini(candidates, {count, recentTitles, now, onLog});
    if (geminiPicks?.length) {
      onLog(`✅ Gemini đã xếp hạng thành công ${geminiPicks.length} bài.`);
      return geminiPicks;
    }
  }

  onLog(`⚠️ Xếp hạng LLM thất bại. Dùng chọn luân phiên.`);
  return [];
}
