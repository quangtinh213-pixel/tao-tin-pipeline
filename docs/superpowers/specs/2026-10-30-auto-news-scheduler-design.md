# Auto News Scheduler — Thiết kế

Ngày: 2026-10-30 · Trạng thái: chờ duyệt spec

> **Cập nhật 2026-10-30:** phần lịch launchd (mục 4, 5.6) đã bỏ theo yêu cầu. Thay bằng lệnh agent `/tao-tin` (gõ "tạo tin") — xem `docs/SKILL-TAO-TIN.md`. Lọc tin, lịch sử, Telegram vẫn dùng như thiết kế này.

## 1. Mục tiêu

Tự động lấy tin, dựng video và đăng YouTube (kênh VNNews) **2 đợt/ngày lúc 08:00
và 17:30 (Asia/Ho_Chi_Minh), mỗi đợt 3 video**, chạy trên chiếc Mac này mà không
cần mở terminal, và báo kết quả qua Telegram.

Tiêu chí thành công:
- Mỗi khung giờ có một đợt chạy (kể cả khi máy ngủ đúng giờ đó — chạy bù khi thức).
- Không chọn tin cũ (>12h), tin sai domain, hay tin đã đăng/đã thất bại 2 lần.
- Lỗi hạ tầng (proxy OpenAI rớt, hết quota YouTube) không làm mất bài và luôn có
  tin nhắn Telegram giải thích.
- Video render xong nhưng upload lỗi sẽ được upload lại ở đợt sau.

## 2. Hiện trạng (2026-10-30)

Đã có `scripts/auto-news-pipeline.mjs`: quét RSS Tuổi Trẻ / VnExpress / Dân Trí →
chọn luân phiên 3 bài → `createProductionManager` (agent OpenAI, template
`news/media-showcase`, audio `full`) → `uploadVideo` → ghi
`data/processed-news.json`. Có `--daemon` (setInterval, so khớp đúng phút).

Vấn đề quan sát được:
1. Chỉ 1 đợt thành công (27-10, 3/3). Đợt 29-10 0/3 do `Connection error` từ
   proxy `OPENAI_BASE_URL`; không retry, không cảnh báo.
2. Không có launchd/cron; daemon không chạy.
3. Không lọc ngày đăng/domain: đã chọn bài Dân Trí năm 2025 và URL
   `2022.dantri.dev`.
4. Bài thất bại không được ghi lịch sử → bị chọn lại mãi. Upload lỗi không retry.

## 3. Quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Nơi chạy | Mac này, launchd (one-shot mỗi lần kích hoạt) — hướng A |
| Lịch | 08:00 và 17:30, 3 video/đợt |
| Đăng | Tự động `public` (giữ `YOUTUBE_PRIVACY_STATUS`) |
| Thông báo | Telegram bot |
| Chọn tin | Lọc cứng + 1 lần gọi LLM xếp hạng |
| Đánh thức máy | `pmset repeat wakeorpoweron MTWRFSU 07:55:00` + bật "không tự ngủ khi cắm sạc"; launchd chạy bù khi máy thức |

## 4. Kiến trúc

```
launchd ~/Library/LaunchAgents/com.vnnews.auto-news.plist
  StartCalendarInterval: 08:00, 17:30
  └─ scripts/run-auto-news.sh
       - export PATH (node, ffmpeg), cd project root
       - log → data/logs/YYYY-MM-DD-HHMM.log
       - node scripts/auto-news-pipeline.mjs --count 3
       - exit code ≠ 0 → node scripts/notify-telegram.mjs "<crash + đường dẫn log>"
```

Luồng một đợt trong `runAutoNewsBatch`:

0. **Lock** `data/auto-news.lock` (chứa PID + thời điểm). Lock tồn tại và PID còn
   sống và tuổi < 3h → thoát, gửi Telegram "đợt trước còn chạy". Ngược lại xoá
   lock cũ và tiếp tục. Luôn xoá lock trong `finally`.
1. **Preflight proxy**: 1 lời gọi rẻ tới OpenAI qua `OPENAI_BASE_URL`. Lỗi → chờ 5
   phút, thử tối đa 3 lần; vẫn lỗi → dừng đợt, Telegram cảnh báo, không ghi
   lịch sử bài nào.
2. **Backlog upload**: các mục `status: 'rendered'` → `uploadVideo` lại (tối đa 3
   lần/mục).
3. **Quét RSS** (giữ `fetchFeedItems`) → **lọc cứng** (mục 5.1).
4. **Xếp hạng LLM** → chọn tối đa 3 bài (mục 5.2).
5. **Sản xuất** tuần tự bằng production manager hiện có (`maxConcurrent: 1`),
   `waitForProductionJob` timeout 20 phút/video; lỗi → `retryJob` 1 lần.
6. **Upload** từng video ngay sau khi render.
7. **Ghi lịch sử** sau mỗi video; **gửi Telegram tổng kết**.

## 5. Thành phần

### 5.1 Lọc cứng (trong `auto-news-pipeline.mjs`)

- `DEFAULT_FEEDS[*].domains`: `['tuoitre.vn']`, `['vnexpress.net']`,
  `['dantri.com.vn']`. Hostname của link phải bằng hoặc kết thúc bằng
  `.<domain>`.
- `isFresh(item, now, maxAgeHours = 12)`: `pubDate` parse được và trong 12h gần
  nhất; không có/không parse được → loại.
- `normalizeUrl(url)`: bỏ query, hash, `/` cuối. Dùng cho mọi so sánh lịch sử
  (cả URL đọc từ `videos/*/context.txt`).
- Loại URL có trong lịch sử với `status` `completed`/`rendered`, hoặc `failed` và
  `attempts >= 2`.

### 5.2 Xếp hạng — `scripts/rank-news.mjs` (mới)

`rankArticles(candidates, {count, recentTitles, client})` → mảng bài đã chọn,
mỗi bài kèm `reason`.

- Đầu vào: tối đa 30 ứng viên, mới nhất trước, chia đều ~10/nguồn; mỗi ứng viên
  `{index, source, title, description (200 ký tự), ageHours, hasImage}`, cùng
  `recentTitles` = tiêu đề các video đã đăng 24h qua.
- Prompt: chọn `count` bài mới, tác động lớn tới người đọc Việt Nam, có tiềm
  năng hình ảnh; **không chọn 2 bài cùng một sự kiện**, không lặp sự kiện trong
  `recentTitles`. Trả JSON `{"picks":[{"index":n,"reason":"..."}]}`.
- Model: `OPENAI_MODEL`, client tạo giống `dashboard-production.mjs`
  (`OPENAI_BASE_URL`).
- Kiểm tra trong code: index nguyên, trong khoảng, không trùng; tối đa 2
  bài/nguồn. Thiếu bài hoặc LLM lỗi/JSON hỏng → lấp bằng
  `selectArticlesForBatch` (luân phiên nguồn) trên các ứng viên còn lại, `reason`
  = `"fallback luân phiên"`.

### 5.3 Lịch sử — `data/processed-news.json`

Mỗi mục: `{title, url (đã normalize), source, slug, processedAt, status,
attempts, uploadAttempts, lastError, youtubeUrl, videoId, reason}`.

- Mục `rendered` có `uploadAttempts >= 3` → chuyển `failed` (không chọn lại),
  ghi vào tin Telegram để upload tay nếu muốn.

- `status`: `completed` | `rendered` (render xong, chờ upload) | `failed`.
- Mục cũ không có `attempts` coi như `completed` — không cần migrate.
- Cập nhật tại chỗ theo `url` (không push trùng).

### 5.4 Phân loại lỗi và retry

| Lỗi | Xử lý | Tính vào `attempts` bài? |
|---|---|---|
| Proxy OpenAI không kết nối (preflight) | Chờ 5', thử 3 lần, rồi dừng đợt | Không |
| Lỗi kết nối giữa chừng trong agent | Thêm `connection error\|fetch failed` vào regex `isTransient` ở `dashboard-production.mjs` (~dòng 415) — agent tự retry | — |
| Job render thất bại | `retryJob` 1 lần; vẫn lỗi → `failed` | Có (+1) |
| Upload lỗi thường | `status: 'rendered'`, backlog đợt sau, tối đa 3 lần | Không (đếm riêng `uploadAttempts`) |
| YouTube `quotaExceeded` | Dừng mọi upload của đợt, giữ backlog | Không |

### 5.5 Telegram — `scripts/notify-telegram.mjs` (mới)

- `sendTelegram(text, {fetcher = fetch})`: POST
  `https://api.telegram.org/bot<TOKEN>/sendMessage` với `TELEGRAM_CHAT_ID`.
  Thiếu token/chat ID → chỉ log, trả `false`. Mọi lỗi được nuốt và log — không
  bao giờ làm hỏng đợt.
- CLI: `node scripts/notify-telegram.mjs "<text>"` (dùng trong wrapper khi crash).
- Không log/in token.
- Tin tổng kết:
  ```
  ✅ Đợt 08:00 30/10 — 3/3 video
  1. [Tuổi Trẻ] <tiêu đề> → https://youtu.be/xxx
     Lý do: <reason>
  ❌ [Dân Trí] <tiêu đề> — <lỗi rút gọn>
  ⏭ Backlog: 1 video chờ upload lại
  ```
- Tin riêng cho: proxy chết, không có tin mới, đợt trước còn chạy, crash.

### 5.6 Cài đặt lịch — `scripts/install-scheduler.mjs` (mới)

- Sinh plist từ template `scripts/launchd/com.vnnews.auto-news.plist` với đường
  dẫn tuyệt đối của project; ghi vào `~/Library/LaunchAgents/`;
  `launchctl bootout` (nếu có) rồi `launchctl bootstrap gui/$UID`.
- `--uninstall`: bootout + xoá plist.
- In hướng dẫn `pmset` (cần sudo — người dùng tự chạy, script không chạy sudo).
- npm scripts: `auto-news:install`, `auto-news:uninstall`.
- Tài liệu: `docs/SKILL-AUTO-NEWS.md` (cài đặt, gỡ, xem log, kiểm tra
  `launchctl print`), và thêm dòng vào `AGENTS.md`/`/ai-help` nếu cần.
- `.env.example`: thêm `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

`--daemon` giữ nguyên để tương thích, không dùng trong luồng mới.

## 6. Kiểm thử

Unit (vitest, mở rộng `scripts/auto-news-pipeline.test.mjs`, thêm
`rank-news.test.mjs`, `notify-telegram.test.mjs`):
- Parse `pubDate` mẫu thật của 3 báo; `isFresh` biên 12h; thiếu `pubDate`.
- Lọc domain (`2022.dantri.dev` bị loại); `normalizeUrl`.
- Lịch sử: bỏ `completed`/`rendered`, bỏ `failed` ≥2, giữ `failed` 1; mục cũ
  không `attempts`.
- `rankArticles`: index ngoài khoảng, trùng, >2/nguồn, JSON hỏng, client throw →
  fallback.
- Lock: lock của PID chết / quá 3h bị xoá; lock sống → thoát.
- Telegram: không token → không gọi fetch; fetch throw → không throw.
- Upload `quotaExceeded` → dừng upload, mục ở `rendered`.
- Các test hiện có vẫn pass (`npm test`).

Tích hợp:
- `npm run auto-news:dry` in ứng viên sau lọc + lựa chọn LLM kèm lý do.

Nghiệm thu thật:
- `launchctl kickstart` với `--count 1 --privacy unlisted` → có video, có tin
  Telegram, log ở `data/logs/`.
- Đọc log của đợt thật kế tiếp (08:00 hoặc 17:30).

## 7. Ngoài phạm vi

UI lập lịch trong dashboard, nhiều kênh, thumbnail riêng, dọn `videos/`, đổi
template/giọng đọc, chạy trên VPS/cloud.

## 8. Rủi ro

- Máy tắt/mất mạng → lỡ đợt (launchd chỉ chạy bù khi máy thức lại).
- Quota YouTube mặc định khá sát với 6 upload/ngày; backlog không retry vô hạn.
- Kênh đăng public tự động tin nhạy cảm (tai nạn, hình sự) mà không có người
  duyệt — đã được chủ kênh chấp nhận.
