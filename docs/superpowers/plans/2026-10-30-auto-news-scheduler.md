# Auto News Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến `scripts/auto-news-pipeline.mjs` thành một đợt chạy một-lần đáng tin cậy, được launchd gọi lúc 08:00 và 17:30, chọn tin mới bằng lọc cứng + LLM, retry đúng loại lỗi và báo Telegram.

**Architecture:** launchd → `scripts/run-auto-news.sh` → `node scripts/auto-news-pipeline.mjs --count 3`. Pipeline giữ vai trò điều phối; thêm hai module nhỏ `rank-news.mjs` (xếp hạng LLM) và `notify-telegram.mjs`. Mọi phụ thuộc bên ngoài (fetch, OpenAI, uploader, production manager, đồng hồ, notifier) được inject qua options để test.

**Tech Stack:** Node 22 ESM (`.mjs`), vitest 2, `openai` SDK (Responses API qua `OPENAI_BASE_URL`), launchd/plist, bash.

**Spec:** `docs/superpowers/specs/2026-10-30-auto-news-scheduler-design.md`

## Global Constraints

- Project **không phải git repo** → không có bước commit; mỗi task kết thúc bằng `npm test` xanh.
- Không thêm dependency npm. Dùng `fetch` gốc, `node:fs`, `node:child_process`.
- Lịch: `08:00` và `17:30`; múi giờ hệ thống hiện là `+0700` (launchd dùng giờ hệ thống).
- `count` mặc định `3`; `maxAgeHours` `12`; tối đa `30` ứng viên, `10`/nguồn gửi LLM; tối đa `2` bài/nguồn mỗi đợt.
- Bài `failed` bị loại khi `attempts >= 2`; upload backlog tối đa `3` lần (`uploadAttempts`).
- Preflight: `3` lần, cách nhau `5` phút. Timeout mỗi video `20` phút. Lock cũ khi PID chết hoặc tuổi `> 3` giờ.
- OpenAI client tạo đúng như `dashboard-production.mjs`: `new OpenAI({apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined})`, gọi `client.responses.create`, model `process.env.OPENAI_MODEL`.
- Không bao giờ log/in `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` hay giá trị `.env`.
- Thông báo/log bằng tiếng Việt, giữ giọng log hiện có (emoji + câu ngắn).
- Node chạy qua nvm (`/Users/quangtinh/.nvm/versions/node/v22.23.4/bin/node`) → plist phải chứa PATH tuyệt đối tới thư mục node lúc cài.
- Export hiện có của `auto-news-pipeline.mjs` giữ nguyên tên và chữ ký (thêm option được, không đổi nghĩa tham số cũ).

## Review Focus

1. **RSS `pubDate` định dạng lạ hoặc không có múi giờ** → bài bị loại (không crash, không coi là mới). Test ở Task 1.
2. **LLM trả text có rào ```json hoặc chữ thừa quanh JSON** → vẫn parse được object đầu tiên; parse hỏng → `[]` rồi fallback luân phiên. Test ở Task 2.
3. **Process bị kill giữa đợt (lock còn lại, PID chết)** → đợt kế tiếp tự gỡ lock và chạy. Test ở Task 4.
4. **Hết quota YouTube giữa đợt** → các video còn lại vẫn được render, nằm ở `rendered`, không tăng `uploadAttempts`. Test ở Task 5.
5. **Telegram API trả lỗi/timeout hoặc thiếu biến môi trường** → đợt vẫn hoàn tất, exit code 0. Test ở Task 3 và Task 5.

---

### Task 1: Lọc cứng và lịch sử theo trạng thái

**Files:**
- Modify: `scripts/auto-news-pipeline.mjs` (`DEFAULT_FEEDS`, `loadProcessedHistory`, thêm helper)
- Test: `scripts/auto-news-pipeline.test.mjs`

**Interfaces:**
- Produces:
  - `normalizeUrl(url: string): string` — bỏ query, hash, `/` cuối; URL không hợp lệ → trả nguyên chuỗi đã trim.
  - `isFresh(item: {pubDate?: string}, now: Date, maxAgeHours = 12): boolean` — `0 <= now - Date.parse(pubDate) <= maxAgeHours h`; NaN → `false`. Cho phép lệch tương lai tối đa 10 phút (đồng hồ báo lệch).
  - `matchesFeedDomain(link: string, domains?: string[]): boolean` — `domains` rỗng/undefined → `true`; ngược lại hostname `=== d` hoặc `endsWith('.' + d)`.
  - `isHistoryBlocking(entry): boolean` — `true` khi không có `status`, hoặc `status` là `completed`/`rendered`, hoặc `failed` với `attempts >= 2`.
  - `loadProcessedHistory(historyPath, videosDir)` → `{processedUrls: Set<string> (đã normalize, chỉ mục chặn), processedSlugs, historyList}`.
  - `filterCandidates(groupedItems: Record<string, Item[]>, {feeds, processedUrls, now, maxAgeHours = 12}): Record<string, Item[]>`.
  - `upsertHistory(historyList: object[], entry: object): object` — tìm theo `normalizeUrl(url)`, merge vào mục cũ hoặc push mới; trả mục kết quả.
  - `DEFAULT_FEEDS[i].domains`: `['tuoitre.vn']`, `['vnexpress.net']`, `['dantri.com.vn']`.

- [ ] **Step 1: Viết test thất bại** trong `describe('filters')` mới:

```js
const now = new Date('2026-10-30T01:00:00Z'); // 08:00 +07
it('isFresh accepts RFC822 dates of all three outlets within 12h', () => {
  expect(isFresh({pubDate: 'Fri, 30 Oct 2026 07:30:00 +0700'}, now)).toBe(true);   // Tuổi Trẻ/VnExpress
  expect(isFresh({pubDate: 'Thu, 29 Oct 2026 20:05:00 +0700'}, now)).toBe(true);   // 11h55 trước
  expect(isFresh({pubDate: 'Thu, 29 Oct 2026 19:59:00 +0700'}, now)).toBe(false);  // 12h01 trước
  expect(isFresh({pubDate: 'Thu, 30 Oct 2026 07:00:00 GMT+7'}, now)).toBe(false);  // định dạng lạ, Date.parse NaN → loại
});
it('isFresh boundaries', () => {
  expect(isFresh({pubDate: '2026-10-29T13:00:00Z'}, now)).toBe(true);  // đúng 12h
  expect(isFresh({pubDate: '2026-10-29T12:59:00Z'}, now)).toBe(false);
  expect(isFresh({pubDate: '2026-10-30T01:09:00Z'}, now)).toBe(true);  // tương lai 9'
  expect(isFresh({pubDate: '2026-10-30T01:11:00Z'}, now)).toBe(false);
  expect(isFresh({pubDate: ''}, now)).toBe(false);
  expect(isFresh({pubDate: 'hôm qua'}, now)).toBe(false);
});
it('matchesFeedDomain rejects staging mirrors', () => {
  expect(matchesFeedDomain('https://dantri.com.vn/a.htm', ['dantri.com.vn'])).toBe(true);
  expect(matchesFeedDomain('https://m.dantri.com.vn/a.htm', ['dantri.com.vn'])).toBe(true);
  expect(matchesFeedDomain('https://2022.dantri.dev/a.htm', ['dantri.com.vn'])).toBe(false);
  expect(matchesFeedDomain('https://evil-dantri.com.vn/a', ['dantri.com.vn'])).toBe(false);
  expect(matchesFeedDomain('https://x.vn/a')).toBe(true);
});
it('normalizeUrl strips query, hash and trailing slash', () => {
  expect(normalizeUrl('https://vnexpress.net/a.html?utm=1#c')).toBe('https://vnexpress.net/a.html');
  expect(normalizeUrl('https://tuoitre.vn/a/')).toBe('https://tuoitre.vn/a');
});
it('history blocks completed/rendered/legacy and failed>=2 only', () => {
  expect(isHistoryBlocking({url: 'u'})).toBe(true);
  expect(isHistoryBlocking({status: 'rendered'})).toBe(true);
  expect(isHistoryBlocking({status: 'failed', attempts: 1})).toBe(false);
  expect(isHistoryBlocking({status: 'failed', attempts: 2})).toBe(true);
});
it('upsertHistory merges by normalized url', () => {
  const list = [{url: 'https://a.vn/x', status: 'failed', attempts: 1}];
  upsertHistory(list, {url: 'https://a.vn/x?ref=rss', status: 'failed', attempts: 2});
  expect(list).toHaveLength(1);
  expect(list[0].attempts).toBe(2);
});
it('filterCandidates applies freshness, domain and history', () => { /* 1 tươi đúng domain, 1 cũ, 1 sai domain, 1 trong processedUrls dạng có ?utm → chỉ còn 1 */ });
```

Trước khi chạy Step 2, lấy 1 `pubDate` thật từ mỗi feed (`curl -s <rss> | grep -m1 -o '<pubDate>[^<]*'`) và thêm 1 assertion `isFresh` cho mỗi báo với `now` = pubDate + 1h → `true`. Nếu một báo dùng định dạng `Date.parse` không đọc được, `isFresh` phải tự chuẩn hoá định dạng đó (không được loại toàn bộ báo). Lưu ý dòng `GMT+7` ở trên chỉ là ví dụ định dạng lạ — nếu feed thật dùng đúng định dạng đó thì đổi kỳ vọng thành `true` và chuẩn hoá.

- [ ] **Step 2: Chạy** `npx vitest --run scripts/auto-news-pipeline.test.mjs` — Expected: FAIL (`isFresh is not exported`…).
- [ ] **Step 3: Cài đặt** các hàm trên trong `auto-news-pipeline.mjs`; `loadProcessedHistory` chỉ thêm vào `processedUrls` mục `isHistoryBlocking`, và normalize cả URL từ `videos/*/context.txt`. Thêm `domains` vào `DEFAULT_FEEDS`.
- [ ] **Step 4: Chạy** `npm test` — Expected: PASS toàn bộ (test cũ `loads processed urls from history file and videos context.txt` vẫn xanh vì mục không `status` bị chặn).

---

### Task 2: Xếp hạng LLM — `scripts/rank-news.mjs`

**Files:**
- Create: `scripts/rank-news.mjs`
- Test: `scripts/rank-news.test.mjs`

**Interfaces:**
- Consumes: shape `Item` từ `parseRssXml` (`title, link, pubDate, description, thumbnail, source, sourceId`).
- Produces:
  - `buildCandidatePool(groupedItems: Record<string, Item[]>, {perSource = 10, max = 30} = {}): Item[]` — trong mỗi nguồn sắp `pubDate` mới→cũ, lấy `perSource`, xen kẽ nguồn, cắt `max`.
  - `parsePicksJson(text: string): Array<{index: number, reason: string}>` — lấy khối `{...}` đầu tiên (chịu được rào ```json), trả `picks` hoặc `[]`.
  - `validatePicks(picks, candidates: Item[], {count, maxPerSource = 2}): Array<Item & {reason: string}>` — index nguyên, `0 <= i < candidates.length`, không trùng, ≤ `maxPerSource` theo `sourceId`, cắt `count`.
  - `rankArticles(candidates: Item[], {count, recentTitles = [], now = new Date(), client, model = process.env.OPENAI_MODEL, onLog = () => {}}): Promise<Array<Item & {reason}>>` — **không bao giờ throw**; lỗi → log + `[]`. `client` mặc định tạo theo Global Constraints.

- [ ] **Step 1: Viết test thất bại**:

```js
it('parsePicksJson tolerates code fences and prose', () => {
  expect(parsePicksJson('Đây:\n```json\n{"picks":[{"index":2,"reason":"nóng"}]}\n```')).toEqual([{index: 2, reason: 'nóng'}]);
  expect(parsePicksJson('không có json')).toEqual([]);
});
it('validatePicks drops out-of-range, duplicate, non-integer and >2 per source', () => {
  const c = [a1, a2, a3, b1]; // a* sourceId 'a', b1 sourceId 'b'
  const r = validatePicks([{index: 9}, {index: 0}, {index: 0}, {index: 1.5}, {index: 1}, {index: 2}, {index: 3}], c, {count: 3});
  expect(r.map((x) => x.link)).toEqual([a1.link, a2.link, b1.link]);
});
it('buildCandidatePool caps 10 per source and 30 total, newest first', () => { /* 4 nguồn × 15 bài → length 30, mỗi nguồn ≤10, phần tử đầu mỗi nguồn là bài mới nhất */ });
it('rankArticles sends recentTitles and returns validated picks with reason', async () => {
  const client = {responses: {create: vi.fn().mockResolvedValue({output_text: '{"picks":[{"index":1,"reason":"tác động lớn"}]}'})}};
  const r = await rankArticles([a1, b1], {count: 3, recentTitles: ['Tin cũ'], client, model: 'm', now});
  expect(r).toEqual([{...b1, reason: 'tác động lớn'}]);
  expect(JSON.stringify(client.responses.create.mock.calls[0][0])).toContain('Tin cũ');
});
it('rankArticles returns [] when client throws', async () => {
  const client = {responses: {create: vi.fn().mockRejectedValue(new Error('Connection error.'))}};
  expect(await rankArticles([a1], {count: 1, client, model: 'm'})).toEqual([]);
});
```

- [ ] **Step 2: Chạy** `npx vitest --run scripts/rank-news.test.mjs` — Expected: FAIL (module chưa có).
- [ ] **Step 3: Cài đặt.** Prompt (tiếng Việt) gồm: vai trò biên tập viên kênh tin ngắn VNNews; tiêu chí: mới, tác động lớn tới người đọc Việt Nam, có tiềm năng hình ảnh (`hasImage`); **không chọn 2 bài cùng một sự kiện**, không lặp sự kiện trong danh sách "đã đăng 24h qua"; chỉ trả JSON `{"picks":[{"index":n,"reason":"<≤20 từ>"}]}`. Mỗi ứng viên gửi `{index, source, title, description: description.slice(0, 200), ageHours: round 1 chữ số, hasImage: Boolean(thumbnail)}`. Đọc `response.output_text`.
- [ ] **Step 4: Chạy** `npm test` — Expected: PASS.

---

### Task 3: Telegram — `scripts/notify-telegram.mjs`

**Files:**
- Create: `scripts/notify-telegram.mjs`
- Test: `scripts/notify-telegram.test.mjs`
- Modify: `.env.example` (thêm khối `TELEGRAM_BOT_TOKEN=` và `TELEGRAM_CHAT_ID=` kèm 1 dòng chú thích tạo bot qua @BotFather)

**Interfaces:**
- Produces: `sendTelegram(text: string, {fetcher = fetch, env = process.env, log = console.log} = {}): Promise<boolean>` — POST `https://api.telegram.org/bot${TOKEN}/sendMessage`, body JSON `{chat_id, text, disable_web_page_preview: true}`, `AbortSignal.timeout(15000)`. Thiếu token/chat → log `⚠️ Chưa cấu hình Telegram…`, trả `false`. `!res.ok` hoặc throw → log (không kèm token), trả `false`. Text > 4000 ký tự → cắt và thêm `…`.
- CLI: chạy trực tiếp với `process.argv.slice(2).join(' ')`, luôn exit 0.

- [ ] **Step 1: Viết test thất bại**:

```js
it('skips fetch when token or chat id missing', async () => {
  const fetcher = vi.fn();
  expect(await sendTelegram('x', {fetcher, env: {}, log: () => {}})).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
it('posts to the bot endpoint with chat id', async () => {
  const fetcher = vi.fn().mockResolvedValue({ok: true});
  expect(await sendTelegram('xin chào', {fetcher, env: {TELEGRAM_BOT_TOKEN: 'T', TELEGRAM_CHAT_ID: '42'}, log: () => {}})).toBe(true);
  expect(fetcher.mock.calls[0][0]).toBe('https://api.telegram.org/botT/sendMessage');
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({chat_id: '42', text: 'xin chào'});
});
it('never throws and never logs the token', async () => {
  const logs = [];
  const fetcher = vi.fn().mockRejectedValue(new Error('network'));
  expect(await sendTelegram('x', {fetcher, env: {TELEGRAM_BOT_TOKEN: 'SECRET', TELEGRAM_CHAT_ID: '1'}, log: (m) => logs.push(m)})).toBe(false);
  expect(logs.join('\n')).not.toContain('SECRET');
});
it('truncates text over 4000 chars', async () => { /* body.text.length <= 4001 và kết thúc bằng '…' */ });
```

- [ ] **Step 2: Chạy** `npx vitest --run scripts/notify-telegram.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** theo Interfaces.
- [ ] **Step 4: Chạy** `npm test` — Expected: PASS.

---

### Task 4: Lock, preflight proxy và retry lỗi kết nối của agent

**Files:**
- Modify: `scripts/auto-news-pipeline.mjs` (thêm helper)
- Modify: `scripts/dashboard-production.mjs:415` (regex `isTransient`)
- Test: `scripts/auto-news-pipeline.test.mjs`, `scripts/dashboard-production.test.mjs`

**Interfaces:**
- Produces:
  - `acquireLock(lockPath: string, {now = new Date(), isAlive = defaultIsAlive, maxAgeMs = 3 * 3600_000} = {}): {ok: true} | {ok: false, reason: string}` — lock là JSON `{pid, startedAt}`. File có, PID sống, tuổi ≤ maxAge → `{ok:false, reason:'Đợt trước (PID n) vẫn đang chạy từ HH:MM'}`. Ngược lại ghi lock mới với `process.pid`. JSON hỏng → coi là lock cũ.
  - `releaseLock(lockPath: string): void` — xoá nếu tồn tại, nuốt lỗi.
  - `defaultIsAlive(pid: number): boolean` — `process.kill(pid, 0)`; lỗi `EPERM` → `true`, khác → `false`.
  - `checkOpenAiProxy({client, model, attempts = 3, delayMs = 300_000, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), onLog}): Promise<boolean>` — mỗi lần gọi `client.responses.create({model, input: 'ping', max_output_tokens: 16})`; thành công → `true`; hết lượt → `false`. Không ngủ sau lần cuối.
  - `isQuotaError(error): boolean` — `error?.errors?.some((e) => e.reason === 'quotaExceeded')` hoặc `/quota/i.test(error?.message)`.

- [ ] **Step 1: Viết test thất bại**:

```js
it('acquireLock refuses a live fresh lock and replaces dead or stale ones', async () => {
  const lock = join(testDir, 'auto-news.lock');
  const now = new Date('2026-10-30T01:00:00Z');
  await writeFile(lock, JSON.stringify({pid: 111, startedAt: '2026-10-30T00:30:00Z'}));
  expect(acquireLock(lock, {now, isAlive: () => true}).ok).toBe(false);
  expect(acquireLock(lock, {now, isAlive: () => false}).ok).toBe(true);
  await writeFile(lock, JSON.stringify({pid: 111, startedAt: '2026-10-29T21:00:00Z'})); // 4h
  expect(acquireLock(lock, {now, isAlive: () => true}).ok).toBe(true);
  await writeFile(lock, '{hỏng');
  expect(acquireLock(lock, {now, isAlive: () => true}).ok).toBe(true);
  releaseLock(lock);
  expect(existsSync(lock)).toBe(false);
});
it('checkOpenAiProxy retries 3 times with delay then gives up', async () => {
  const create = vi.fn().mockRejectedValue(new Error('Connection error.'));
  const sleep = vi.fn().mockResolvedValue();
  expect(await checkOpenAiProxy({client: {responses: {create}}, model: 'm', sleep, onLog: () => {}})).toBe(false);
  expect(create).toHaveBeenCalledTimes(3);
  expect(sleep).toHaveBeenCalledTimes(2);
  expect(sleep).toHaveBeenCalledWith(300_000);
});
it('checkOpenAiProxy succeeds on second try', async () => { /* reject rồi resolve → true, create 2 lần */ });
it('isQuotaError detects googleapis quotaExceeded', () => {
  expect(isQuotaError({errors: [{reason: 'quotaExceeded'}]})).toBe(true);
  expect(isQuotaError(new Error('The request cannot be completed because you have exceeded your quota.'))).toBe(true);
  expect(isQuotaError(new Error('invalid_grant'))).toBe(false);
});
```

Trong `dashboard-production.test.mjs`, test hàm mới export `isTransientAgentError(error): boolean` (tách nguyên biểu thức `isTransient` hiện có ra hàm này):

```js
it('treats OpenAI connection errors as transient', () => {
  expect(isTransientAgentError(new Error('Connection error.'))).toBe(true);
  expect(isTransientAgentError(new Error('fetch failed'))).toBe(true);
  expect(isTransientAgentError({status: 503, message: ''})).toBe(true);
  expect(isTransientAgentError({code: 'ECONNRESET', message: ''})).toBe(true);
  expect(isTransientAgentError(new Error('Incorrect API key provided'))).toBe(false);
});
```

- [ ] **Step 2: Chạy** `npx vitest --run scripts/auto-news-pipeline.test.mjs scripts/dashboard-production.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** helper; ở `dashboard-production.mjs` tách `isTransientAgentError` (export), mở rộng regex thành `/overload|busy|unavailable|rate limit|timeout|connection error|fetch failed/i`, và thay biểu thức cũ trong vòng retry bằng lời gọi hàm này.
- [ ] **Step 4: Chạy** `npm test` — Expected: PASS.

---

### Task 5: Điều phối đợt mới trong `runAutoNewsBatch`

**Files:**
- Modify: `scripts/auto-news-pipeline.mjs` (`runAutoNewsBatch`, `waitForProductionJob` mặc định, CLI)
- Test: `scripts/auto-news-pipeline.test.mjs` (cập nhật 2 test `runAutoNewsBatch` cũ + test mới)

**Interfaces:**
- Consumes: Task 1 (`filterCandidates`, `upsertHistory`, `loadProcessedHistory`, `normalizeUrl`), Task 2 (`buildCandidatePool`, `rankArticles`), Task 3 (`sendTelegram`), Task 4 (`acquireLock`, `releaseLock`, `checkOpenAiProxy`, `isQuotaError`), `selectArticlesForBatch` hiện có, `manager.retryJob(id)` hiện có.
- Produces:
  - Options mới của `runAutoNewsBatch`: `now = () => new Date()`, `lockFile = path.join(DEFAULT_DATA_DIR, 'auto-news.lock')`, `preflight = () => checkOpenAiProxy({...})`, `ranker = rankArticles`, `notify = sendTelegram`, `jobTimeoutMs = 20 * 60_000`, `maxAgeHours = 12`.
  - Kết quả: `{processed, failed, total, backlog: {uploaded: number, pending: number}, aborted?: 'locked' | 'proxy' | 'no-news', dryRun?}`.
  - `formatBatchSummary({slotLabel: string, processed, failed, backlogPending: number, notes: string[]}): string` — đúng mẫu ở spec 5.5 (`✅ Đợt 08:00 30/10 — 3/3 video`, mỗi bài `n. [Nguồn] tiêu đề → url` + dòng `   Lý do: …`, `❌ [Nguồn] tiêu đề — lỗi` (lỗi cắt 120 ký tự), `⏭ Backlog: n video chờ upload lại` khi n > 0). Dùng `❌` thay `✅` ở dòng đầu khi 0 video thành công và có lỗi.
  - Hằng `MAX_RENDER_ATTEMPTS = 2`, `MAX_UPLOAD_ATTEMPTS = 3`.

Thứ tự trong `runAutoNewsBatch` (không phải dry-run):
1. `acquireLock` → không ok: `notify('⏳ ' + reason)`, trả `aborted:'locked'` (không gỡ lock).
2. `try { … } finally { releaseLock }`.
3. `preflight()` false → `notify('🔌 Proxy OpenAI không phản hồi sau 3 lần thử, bỏ qua đợt …')`, trả `aborted:'proxy'`, **không ghi lịch sử**.
4. Backlog: mỗi mục `status:'rendered'` → `uploader(slug)`; thành công → `upsertHistory` `completed` + `youtubeUrl/videoId`; quota → dừng toàn bộ upload còn lại của đợt (cờ `quotaHit`), không tăng `uploadAttempts`; lỗi khác → `uploadAttempts+1`, `>= MAX_UPLOAD_ATTEMPTS` → `status:'failed'`, `attempts: MAX_RENDER_ATTEMPTS` (để bị chặn) và push vào `failed` với `error: 'upload lỗi 3 lần — video ở videos/<slug>/output/video.mp4, upload tay nếu cần'`.
5. Quét RSS → `filterCandidates` → `buildCandidatePool` → `ranker(pool, {count, recentTitles, now})`, trong đó `recentTitles` = `title` các mục `completed` có `processedAt` trong 24h. Thiếu bài → lấp bằng `selectArticlesForBatch(groupFromPool, processedUrls ∪ đã chọn, count - picks.length)` với `reason: 'fallback luân phiên'`. 0 bài → `notify('📭 Không có tin mới …')`, `aborted:'no-news'`.
6. Mỗi bài: `createJob` → `waitForProductionJob(manager, id, 2000, jobTimeoutMs)`; không `completed` → `retryJob(id)` 1 lần rồi chờ lại; vẫn lỗi → `upsertHistory` `{status:'failed', attempts: (cũ||0)+1, lastError}` và push `failed`. Timeout cũng tính là lỗi bài.
7. Render xong: `upsertHistory` `{status:'rendered', slug, reason, uploadAttempts: 0}` **trước** khi upload; nếu `quotaHit` thì bỏ qua upload; upload thành công → `completed`; quota → `quotaHit = true`; lỗi khác → `uploadAttempts: 1`. `saveProcessedHistory` sau mỗi bài.
8. `notify(formatBatchSummary(...))`; notes gồm `'Hết quota YouTube — video chờ upload ở đợt sau'` khi `quotaHit`.

Dry-run: không lock, không preflight, không notify; vẫn lọc + `ranker` + in từng bài kèm `reason`.

`slotLabel` = giờ `HH:MM dd/MM` theo `Asia/Ho_Chi_Minh` của `now()`.

- [ ] **Step 1: Cập nhật 2 test cũ** để truyền `now: () => new Date('2026-10-30T01:00:00Z')`, `preflight: async () => true`, `ranker: async (pool, {count}) => pool.slice(0, count).map((x) => ({...x, reason: 't'}))`, `notify: vi.fn().mockResolvedValue(true)`, `lockFile: join(testDir, 'l.lock')`, và thêm `<pubDate>Fri, 30 Oct 2026 07:00:00 +0700</pubDate>` vào mọi `<item>` của fixture. Mock manager thêm `retryJob: vi.fn()`.
- [ ] **Step 2: Viết test mới thất bại** (dùng chung helper `makeManager(statuses)` trả job theo danh sách trạng thái):

```js
it('aborts on proxy failure without touching history', async () => {
  const notify = vi.fn().mockResolvedValue(true);
  const r = await runAutoNewsBatch({...base, preflight: async () => false, notify});
  expect(r.aborted).toBe('proxy');
  expect(existsSync(historyFile)).toBe(false);
  expect(notify.mock.calls[0][0]).toContain('Proxy OpenAI');
  expect(existsSync(lockFile)).toBe(false);
});
it('exits early when another batch holds the lock', async () => { /* ghi lock pid=process.pid, startedAt=now → aborted 'locked', productionManager.createJob không được gọi */ });
it('records failed render with attempts and retries the job once', async () => {
  // job luôn 'failed' → retryJob gọi 1 lần; history: {status:'failed', attempts:1}; chạy lần 2 → attempts:2; lần 3 → bài không được chọn nữa
});
it('stops uploads after quotaExceeded but keeps rendering', async () => {
  // 3 bài, uploader: lần 1 ok, lần 2 throw {errors:[{reason:'quotaExceeded'}]}
  // → uploader gọi đúng 2 lần, 3 job render, history: 1 completed, 2 rendered với uploadAttempts 0
});
it('uploads backlog first and fails it after 3 upload attempts', async () => {
  // history có {status:'rendered', slug:'s1', uploadAttempts:2}; uploader throw Error('boom')
  // → mục thành {status:'failed', uploadAttempts:3}
});
it('falls back to rotation when ranker returns nothing', async () => { /* ranker → [] ; 2 nguồn → 2 bài với reason 'fallback luân phiên' */ });
it('still completes when notify throws', async () => { /* notify: vi.fn().mockRejectedValue(new Error('x')) → không throw, processed có bài */ });
it('formatBatchSummary matches the spec layout', () => {
  expect(formatBatchSummary({slotLabel: '08:00 30/10', processed: [{source: 'Tuổi Trẻ', title: 'A', youtubeUrl: 'https://youtu.be/x', reason: 'nóng'}], failed: [{source: 'Dân Trí', title: 'B', error: 'render timeout'}], backlogPending: 1, notes: []}))
    .toBe('✅ Đợt 08:00 30/10 — 1/2 video\n1. [Tuổi Trẻ] A → https://youtu.be/x\n   Lý do: nóng\n❌ [Dân Trí] B — render timeout\n⏭ Backlog: 1 video chờ upload lại');
});
```

Ghi chú: `notify` được bọc `safeNotify = (t) => notify(t).catch(() => false)` trong pipeline để thoả test "notify throws".

- [ ] **Step 3: Chạy** `npx vitest --run scripts/auto-news-pipeline.test.mjs` — Expected: FAIL ở các test mới.
- [ ] **Step 4: Cài đặt** theo thứ tự trên. CLI giữ `--dry-run`, `--count`, `--privacy`, `--daemon`; thêm exit code 1 chỉ khi throw ngoài dự kiến (aborted không phải lỗi → exit 0).
- [ ] **Step 5: Chạy** `npm test` — Expected: PASS toàn bộ.
- [ ] **Step 6: Chạy thật dry-run** `npm run auto-news:dry` — Expected: in số bài sau lọc mỗi nguồn, ≤3 bài chọn kèm `Lý do:`; không có URL `dantri.dev`; không có bài `pubDate` > 12h.

---

### Task 6: launchd, wrapper, trình cài và tài liệu

**Files:**
- Create: `scripts/run-auto-news.sh` (chmod +x)
- Create: `scripts/launchd/com.vnnews.auto-news.plist` (template)
- Create: `scripts/install-scheduler.mjs`
- Test: `scripts/install-scheduler.test.mjs`
- Create: `docs/SKILL-AUTO-NEWS.md`, `.claude/commands/auto-news.md` (1 dòng: `Read and follow docs/SKILL-AUTO-NEWS.md.` theo mẫu các command khác)
- Modify: `package.json` (`"auto-news:install": "node scripts/install-scheduler.mjs"`, `"auto-news:uninstall": "node scripts/install-scheduler.mjs --uninstall"`), `AGENTS.md` (mục `/auto-news` ngắn trong Commands), `docs/SKILL-AI-HELP.md` (thêm dòng lệnh)

**Interfaces:**
- Produces:
  - `renderPlist(template: string, {root: string, pathEnv: string}): string` — thay `__ROOT__` và `__PATH__` (escape `&`, `<`, `>`).
  - `buildPathEnv(execPath = process.execPath): string` — `${dirname(execPath)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`.
  - CLI: cài → ghi `~/Library/LaunchAgents/com.vnnews.auto-news.plist`, `launchctl bootout gui/<uid>/com.vnnews.auto-news` (bỏ qua lỗi), `launchctl bootstrap gui/<uid> <plist>`, in `launchctl print` rút gọn (trạng thái) và hướng dẫn `sudo pmset repeat wakeorpoweron MTWRFSU 07:55:00` + bật "Prevent automatic sleeping on power adapter when the display is off". Cảnh báo nếu offset hệ thống ≠ `+0700`. `--uninstall` → bootout + xoá plist.

Plist template: `Label` `com.vnnews.auto-news`; `ProgramArguments` `["/bin/bash", "__ROOT__/scripts/run-auto-news.sh"]`; `WorkingDirectory` `__ROOT__`; `EnvironmentVariables.PATH` `__PATH__`; `StartCalendarInterval` mảng 2 dict `{Hour 8, Minute 0}`, `{Hour 17, Minute 30}`; `StandardOutPath`/`StandardErrorPath` `__ROOT__/data/logs/launchd.log`; không `RunAtLoad`.

`run-auto-news.sh` (bash, `set -uo pipefail`): `cd "$(dirname "$0")/.."`; `mkdir -p data/logs`; `LOG="data/logs/$(date +%F-%H%M).log"`; `node scripts/auto-news-pipeline.mjs "${@:---count 3}" >>"$LOG" 2>&1`; giữ exit code; khác 0 → `node scripts/notify-telegram.mjs "💥 Đợt auto-news lỗi (exit $code). Log: $PWD/$LOG"`; `cp "$LOG" data/auto-news-latest.log`; `exit $code`.

- [ ] **Step 1: Viết test thất bại**:

```js
it('renderPlist fills absolute root and PATH and stays valid XML', () => {
  const out = renderPlist(readFileSync('scripts/launchd/com.vnnews.auto-news.plist', 'utf8'), {root: '/Users/a b/proj', pathEnv: '/n/bin:/usr/bin'});
  expect(out).not.toMatch(/__ROOT__|__PATH__/);
  expect(out).toContain('<string>/Users/a b/proj/scripts/run-auto-news.sh</string>');
  expect(out).toContain('<integer>17</integer>');
  expect(out).toContain('<integer>30</integer>');
});
it('buildPathEnv puts the node directory first', () => {
  expect(buildPathEnv('/Users/q/.nvm/versions/node/v22/bin/node').split(':')[0]).toBe('/Users/q/.nvm/versions/node/v22/bin');
});
```

- [ ] **Step 2: Chạy** `npx vitest --run scripts/install-scheduler.test.mjs` — Expected: FAIL.
- [ ] **Step 3: Cài đặt** các file trên. `docs/SKILL-AUTO-NEWS.md` gồm: cài/gỡ, cấu hình Telegram bằng `/update-config --key TELEGRAM_BOT_TOKEN …` và `TELEGRAM_CHAT_ID`, lệnh pmset (người dùng tự chạy với sudo), xem log `data/logs/`, kiểm tra `launchctl print gui/$(id -u)/com.vnnews.auto-news`, chạy tay `bash scripts/run-auto-news.sh --count 1 --privacy unlisted`.
- [ ] **Step 4: Chạy** `npm test` và `plutil -lint scripts/launchd/com.vnnews.auto-news.plist` — Expected: PASS và `OK`.

---

### Task 7: Nghiệm thu thật

Không viết code. Cần người dùng đã đặt `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`.

- [ ] **Step 1:** `npm run auto-news:install` — Expected: `launchctl print` hiển thị job `com.vnnews.auto-news`, không lỗi bootstrap; file `~/Library/LaunchAgents/com.vnnews.auto-news.plist` chứa đường dẫn tuyệt đối project và thư mục node nvm.
- [ ] **Step 2:** `bash scripts/run-auto-news.sh --count 1 --privacy unlisted` — Expected: exit 0, `data/logs/<ngày-giờ>.log` có bài được chọn kèm `Lý do:`, video `unlisted` trên YouTube, tin Telegram dạng tổng kết, `processed-news.json` có mục `completed`.
- [ ] **Step 3:** `bash scripts/run-auto-news.sh --count 1 --privacy unlisted` với `OPENAI_BASE_URL` trỏ tới `http://127.0.0.1:9` qua biến môi trường tạm (`OPENAI_BASE_URL=http://127.0.0.1:9 bash …`) — Expected: sau ~10 phút có tin Telegram `🔌 Proxy OpenAI…`, lịch sử không đổi. (Có thể bỏ qua nếu không muốn chờ; unit test Task 5 đã phủ.)
- [ ] **Step 4:** Sau khung 08:00 hoặc 17:30 kế tiếp: đọc `data/auto-news-latest.log` và Telegram — Expected: đợt chạy do launchd, 3 video `public`.
