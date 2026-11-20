# Tái cấu trúc Chiến lược Kênh VN News (`@vnnews213`) & Hợp nhất Pipeline Tự động — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển kênh `@vnnews213` sang một trục nội dung duy nhất (Thời sự dân sinh – Hồ sơ pháp luật – Giải thích quyền lợi), khép kín pipeline tự động cho Shorts (Remotion) và Video dài (HyperFrames với ảnh AI + ảnh thật + đồ họa HTML/CSS, không dùng SVG minh họa tĩnh), tự động fallback sang `GEMINI_API_KEY` khi `agy` hết quota, nối Shorts → Video dài, khôi phục báo cáo YouTube API và dọn sạch 3 video lỗi/trùng trên kênh.

**Architecture:** Node.js (`premium-text-to-video/`) giữ vai trò điều phối lịch (`daily-orchestrator.mjs`), lọc tin (`long-news-filter.mjs`), sản xuất Shorts (`news/media-showcase`), upload & gắn link chéo (`youtube-upload.mjs`), và báo cáo kênh (`yt-report.mjs`). Python (`pipeline/tttc/`) đảm nhiệm toàn bộ khâu sản xuất Video dài 16:9 (`chay_dai.py`) với 2 module mới (`soan_tu_dong.py` cào nguồn + viết kịch bản bằng Gemini API, `tao_anh.py` sinh ảnh AI phóng sự qua Gemini) cùng đạo diễn AI (`tu_dong_dao_dien.py`) và ngưỡng chất lượng mới (`chat_luong.py`).

**Tech Stack:** Node.js (ESM, Vitest), Python 3.12 (`uv`, `pytest`), Google YouTube Data & Analytics API, Gemini API (`GEMINI_API_KEY`), HyperFrames, Remotion, `ffprobe`.

**Spec:** `premium-text-to-video/docs/superpowers/specs/2026-11-16-vnnews-channel-strategy-and-pipeline-design.md`

## Global Constraints
- Không phụ thuộc cứng vào `agy` CLI: mọi ca tự động (`daily-orchestrator.mjs`) và `chay_dai.py` phải tiếp tục chạy được bằng `GEMINI_API_KEY` trong `.env` khi `agy` trả lỗi `RESOURCE_EXHAUSTED` / `429` / mã thoát 3.
- Shorts giữ giãn cách tối thiểu `90` phút (`DEFAULT_PUBLISH_GAP_MINUTES = 90`), `8` Shorts/ngày (`2+2+2+2`) khớp `8` khung giờ (`07:00,09:00,11:30,13:30,15:30,17:30,19:30,21:30`).
- Video dài giữ khung `12:00,15:30` (tránh vùng chết 17:00–21:00), tối đa `1` video/ngày (ngày chẵn ngưỡng ≥45, ngày lẻ ngưỡng ≥55).
- Bỏ hoàn toàn `minh-hoa` SVG tĩnh trong `tu_dong_dao_dien.py`: thay bằng ảnh AI (`anh`), bằng chứng báo chí (`trang-nguon`, `trich-bao`), hiện trường (`b-roll`, `nhan-vat`) và đồ họa dữ liệu HTML/CSS (`thoi-gian`, `ban-do`, `bieu-do`, `xep-hang`, `so-sanh`, `phan-tram`, `so-lon`, `quy-trinh`, `chu-dong`).
- Thương hiệu thống nhất `#VnNews213` (xóa tàn dư `#NhipCongNghe` trong `pipeline/tttc/dang.py`).
- Không đăng 2 video dài tồn cũ trên đĩa (`2026-11-16-starship-starlink-vn`, `2026-11-16-vanh-dai-3-tphcm-thong-xe`). Xóa vĩnh viễn 3 video lỗi/trùng: `lP4wQjjgLUI`, `_brqvHH36ms`, `AEhSdL2yYK0`.

## Review Focus
1. **Lỗi `agy` 429 không rõ ràng hoặc lỗi mạng tạm thời:** `daily-orchestrator.mjs` cần nhận diện đúng các thông điệp quota (`RESOURCE_EXHAUSTED`, `429`, `Individual quota reached`, exit code 3) để fallback sang Direct API, đồng thời ghi log/Telegram rõ ràng nhưng vẫn giữ nguyên lock an toàn.
2. **Đứt gãy metadata giữa HyperFrames (`pipeline/tttc`) và `youtube-upload.mjs`:** Khi video dài HyperFrames không có `spec.json` của Remotion mà chỉ có `canh.json`, `final.mp4` (`output/video.mp4`), `mo-ta.txt`, `phu-de.srt`, `thumbnails/`, `youtube-upload.mjs` phải nhận diện đúng là **Long-form** (không gắn `#Shorts`, có mốc chương, có SRT, có thumbnail).
3. **Upload lọt video hỏng (0s) hoặc tiêu đề slug thô:** Cổng pre-upload trong `youtube-upload.mjs` phải chặn ngay trước khi gọi `youtube.videos.insert` nếu `ffprobe` đo thời lượng `< 5s` hoặc tiêu đề dạng slug (`^[a-z0-9-]+$`).
4. **Cập nhật mô tả Short nối sang Video dài bị lặp hoặc làm mất nội dung cũ:** `linkShortsToLongVideo` phải kiểm tra idempotent (nếu mô tả Short đã chứa `https://youtu.be/<longId>` thì bỏ qua) và luôn giữ nguyên mô tả gốc bên dưới dòng link mới.
5. **Sinh ảnh AI hoặc cào báo thất bại giữa chừng trong `pipeline/tttc`:** Nếu `tao_anh.py` gặp lỗi API hoặc `soan_tu_dong.py` thiếu ảnh, pipeline không được crash sập nếu vẫn còn ảnh trong `nguon/` hoặc fallback về đồ họa dữ liệu HTML/CSS (`chu-dong`, `trich-bao`, `thoi-gian`).

---

### Task 1: Sửa lịch đăng, giãn cách 90 phút và cơ chế Fallback `agy` → Direct API trong `daily-orchestrator.mjs`

**Files:**
- Modify: `premium-text-to-video/scripts/daily-orchestrator.mjs:48-110,175-225`
- Modify: `premium-text-to-video/scripts/youtube-upload.mjs:15-22`
- Test: `premium-text-to-video/scripts/daily-orchestrator.test.mjs` (Create)

**Interfaces:**
- Produces:
  - `isAgyQuotaOrUnavailableError(err: Error | string): boolean`
  - `shouldProduceLongToday({now, topScore}): boolean`
  - `DAILY_SHIFTS` (4 ca, mỗi ca `shorts: 2`; tổng 8 Shorts/ngày)
  - `DEFAULT_PUBLISH_SLOTS = '07:00,09:00,11:30,13:30,15:30,17:30,19:30,21:30'`
  - `DEFAULT_PUBLISH_GAP_MINUTES = 90`
  - `DEFAULT_LONG_PUBLISH_SLOTS = '12:00,15:30'`

- [ ] **Step 1: Write failing tests for shift counts, odd/even long gating, slots, and quota fallback**

Create `premium-text-to-video/scripts/daily-orchestrator.test.mjs` testing:
1. `DAILY_SHIFTS` has `shorts === 2` for shifts `'1'..'4'` (total 8).
2. `DEFAULT_PUBLISH_GAP_MINUTES === 90`, `DEFAULT_LONG_PUBLISH_SLOTS === '12:00,15:30'`, and `DEFAULT_PUBLISH_SLOTS` has 8 slots.
3. `isAgyQuotaOrUnavailableError(new Error('RESOURCE_EXHAUSTED (code 429)')) === true` and `false` for unrelated syntax errors.
4. `shouldProduceLongToday` returns `true` on even VN date with `topScore: 46`, `false` on odd VN date with `topScore: 50`, `true` on odd VN date with `topScore: 56`.
5. `runShift('1', {agyRunner: async () => { throw new Error('RESOURCE_EXHAUSTED (code 429)'); }, shortFallbackRunner: ...})` invokes `shortFallbackRunner` instead of failing the shift.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd premium-text-to-video && npx vitest run scripts/daily-orchestrator.test.mjs`
Expected: FAIL because `isAgyQuotaOrUnavailableError`, `shouldProduceLongToday` do not exist and constants still have old values.

- [ ] **Step 3: Update `youtube-upload.mjs` constants and implement fallback + odd/even gating in `daily-orchestrator.mjs`**

1. In `premium-text-to-video/scripts/youtube-upload.mjs`: update `DEFAULT_PUBLISH_SLOTS`, `DEFAULT_PUBLISH_GAP_MINUTES = 90`, `DEFAULT_LONG_PUBLISH_SLOTS = '12:00,15:30'`.
2. In `premium-text-to-video/scripts/daily-orchestrator.mjs`:
   - Set `shorts: 2` for shifts `1..4` in `DAILY_SHIFTS`.
   - Export `isAgyQuotaOrUnavailableError(err)` matching `RESOURCE_EXHAUSTED|429|quota reached|agy thoát với mã 3|agy CLI chưa sẵn sàng`.
   - Export `shouldProduceLongToday({now, topScore, alreadyProducedToday})`: returns `false` if `alreadyProducedToday`; on even VN day-of-month requires `topScore >= 45`; on odd VN day-of-month requires `topScore >= 55`.
   - In `produceLongVideo` and `runShift`: if `checkAgyPreflight()` is false OR `agyRunner` throws `isAgyQuotaOrUnavailableError(err)`, log fallback notice and run `shortFallbackRunner` (defaults to `runAutoNewsBatch({count: shift.shorts, lockFile: null, onLog: log})`) for Shorts, or `longFallbackRunner` (defaults to spawning `node scripts/tao-video-dai.mjs`) for Long-form.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd premium-text-to-video && npx vitest run scripts/daily-orchestrator.test.mjs scripts/youtube-upload.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-orchestrator.mjs scripts/daily-orchestrator.test.mjs scripts/youtube-upload.mjs
git commit -m "feat: add agy->API fallback, 90m short spacing, and 3-4/week long-form gating"
```

---

### Task 2: Mở khóa bộ lọc Đại án/Dân sinh & ưu tiên chủ đề Shorts nổ view trong `long-news-filter.mjs`

**Files:**
- Modify: `premium-text-to-video/scripts/long-news-filter.mjs:133-243`
- Test: `premium-text-to-video/scripts/long-news-filter.test.mjs`

**Interfaces:**
- Consumes: `data/performance.json` (read optionally if present)
- Produces:
  - Updated `classify(texts, descriptions)` returning `{..., majorCase: boolean, sensitiveGraphic: boolean}`
  - `loadHotShortTopics(perfPath, {minViews: 1000, maxAgeDays: 7})`
  - `scoreCluster` adding `+12` for `majorCase` and `+15` when matching a hot Short topic from `performance.json`.

- [ ] **Step 1: Write failing tests in `long-news-filter.test.mjs`**

Add tests asserting:
1. A major fraud/corruption case (*"Cựu tổng giám đốc Sen Tài Thu hưởng lợi 225 tỉ vụ lừa đảo gần 1.000 tỉ"*) is **not** disqualified by `gateReasons` and gets `+12` majorCase bonus.
2. Graphic violent crime (*"Án mạng chém người tự tử ở..."*) is still flagged `sensitive` and disqualified by `gateReasons` unless `allowLegal` is true.
3. A cluster matching a Short in mock `performance.json` with `views >= 1000` within 7 days receives `+15` `hotShortBonus` in `breakdown`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd premium-text-to-video && npx vitest run scripts/long-news-filter.test.mjs`
Expected: FAIL because `Sen Tài Thu` is currently blocked by `SENSITIVE` (`lừa đảo|bị bắt|khởi tố`).

- [ ] **Step 3: Refactor `SENSITIVE` into `SENSITIVE_GRAPHIC` vs `MAJOR_CASE` and add `hotShortBonus` in `long-news-filter.mjs`**

- Move `lừa đảo|khởi tố|bắt giữ|đường dây|tham nhũng|thất thoát|nghìn tỷ|trăm tỷ` into `MAJOR_CASE` (or check `MAJOR_CASE` + `MASS_REACH`/scale numbers so single-victim petty theft stays blocked while major cases pass).
- Keep `SENSITIVE_GRAPHIC` blocking `giết|sát hại|hiếp|xâm hại|tự tử|chém|đâm|thi thể|tử vong` when not a major public policy/infrastructure case.
- Implement `loadHotShortTopics` reading `data/performance.json` and matching via `sameStory`.

- [ ] **Step 4: Run test to verify pass**

Run: `cd premium-text-to-video && npx vitest run scripts/long-news-filter.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/long-news-filter.mjs scripts/long-news-filter.test.mjs
git commit -m "feat: allow major fraud/public-impact cases and boost hot Short topics in long-news-filter"
```

---

### Task 3: Sửa `youtube-upload.mjs` — Hỗ trợ HyperFrames, Cổng chặn video lỗi, và Cầu nối Shorts → Video dài

**Files:**
- Modify: `premium-text-to-video/scripts/youtube-upload.mjs:134-142,299-465`
- Test: `premium-text-to-video/scripts/youtube-upload.test.mjs`

**Interfaces:**
- Consumes: `ffprobe` (or injected `probeFn` for tests), `canh.json`, `mo-ta.txt`, `phu-de.srt`, `thumbnails/`
- Produces:
  - `isLongFormDir(slugDir, spec, probeDurationFn): boolean`
  - `validatePreUpload({title, durationSec}): void` (throws if `durationSec < 5` or `isSlugTitle(title)`)
  - `linkShortsToLongVideo({youtube, longVideoId, longTitle, videosDir, maxAgeDays: 14, log}): Promise<string[]>`

- [ ] **Step 1: Write failing tests in `youtube-upload.test.mjs`**

Add tests for:
1. `validatePreUpload` throws on `durationSec: 0` or `4.9`, and throws on slug title `'podcast-den-noi-quan-dong-cua-v2'`.
2. `isLongFormDir` returns `true` for a directory containing `canh.json` (no `spec.json`) and `durationSec >= 180`.
3. `linkShortsToLongVideo` finds a recent Short in `videos/` sharing ≥2 title tokens with `longTitle`, calls `youtube.videos.update` to prepend `👉 Xem hồ sơ phân tích đầy đủ: https://youtu.be/<longId>` to its description, and skips calling `update` if the link is already present (idempotent).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd premium-text-to-video && npx vitest run scripts/youtube-upload.test.mjs`
Expected: FAIL with missing functions.

- [ ] **Step 3: Implement pre-upload gate, HyperFrames metadata resolution, and `linkShortsToLongVideo` in `youtube-upload.mjs`**

- Support reading `final.mp4` (if `output/video.mp4` missing), `mo-ta.txt`, `phu-de.srt`, and `thumbnails/*.jpg|png` for HyperFrames directories.
- Run `validatePreUpload` before `youtube.videos.insert`.
- After a successful long-form upload, call `linkShortsToLongVideo` and send Telegram summary of linked Shorts (reminding user to set Related Video in Studio).

- [ ] **Step 4: Run tests to verify pass**

Run: `cd premium-text-to-video && npx vitest run scripts/youtube-upload.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/youtube-upload.mjs scripts/youtube-upload.test.mjs
git commit -m "feat: add pre-upload quality gate, HyperFrames support, and Shorts->Long cross-linking"
```

---

### Task 4: Khôi phục `yt-report.mjs` đọc trực tiếp từ YouTube API & tách báo cáo Shorts vs Long-form

**Files:**
- Modify: `premium-text-to-video/scripts/yt-report.mjs:33-160`
- Test: `premium-text-to-video/scripts/yt-report.test.mjs`

**Interfaces:**
- Consumes: YouTube Data API v3 (`channels.list`, `playlistItems.list`, `videos.list`) + Analytics API v2
- Produces:
  - `fetchChannelVideos({ytClient, videosDir, sinceMs})` returning `{slug, videoId, title, publishAt, seconds, isShort, hookCardArm}[]`
  - `buildSummary` splitting metrics into `Shorts` vs `Long-form` sections.

- [ ] **Step 1: Write failing tests in `yt-report.test.mjs`**

Test `fetchChannelVideos` with a mocked `ytClient` when `videosDir` is empty (simulating disk cleanup): verifies it still returns uploaded videos from the `uploads` playlist, parses ISO 8601 `duration` to `seconds`, classifies `isShort`, and `buildSummary` outputs separate Shorts and Long-form counts/views.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd premium-text-to-video && npx vitest run scripts/yt-report.test.mjs`
Expected: FAIL because `readUploadedVideos` only scans `videosDir`.

- [ ] **Step 3: Implement `fetchChannelVideos` and update `buildReport` & `buildSummary` in `yt-report.mjs`**

- Merge local `videos/<slug>/` metadata (`slug`, `hookCardArm`) when present, and fall back to `videoId` as `slug` when local folder was cleaned up.
- Update `buildReport` to use `fetchChannelVideos` and `buildSummary` to summarize Shorts vs Long-form separately.

- [ ] **Step 4: Run test to verify pass**

Run: `cd premium-text-to-video && npx vitest run scripts/yt-report.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/yt-report.mjs scripts/yt-report.test.mjs
git commit -m "fix: fetch channel videos from YouTube API in yt-report so disk cleanup never blinds analytics"
```

---

### Task 5: Tạo `pipeline/tttc/soan_tu_dong.py` (Tự cào nguồn, chụp bằng chứng & viết kịch bản bằng `GEMINI_API_KEY`)

**Files:**
- Create: `pipeline/tttc/soan_tu_dong.py`
- Test: `pipeline/tests/test_soan_tu_dong.py` (Create)

**Interfaces:**
- Consumes: `chu-de.md` (title + source URLs), `GEMINI_API_KEY` from `.env`, `tttc.gop.kiem_1`
- Produces:
  - `tao_nguon_va_kich_ban(video_dir: Path, gemini_fn=None, fetch_fn=None) -> tuple[Path, Path]` writing `nguon.json`, `nguon/*.jpg|png`, and `kich-ban.md` (passing `gop.kiem_1` with up to 2 self-correction retries).

- [ ] **Step 1: Write failing tests in `pipeline/tests/test_soan_tu_dong.py`**

Mock `fetch_fn` (returning sample HTML with `<img>` and `<p>`) and `gemini_fn` (first returning a script with a forbidden word, second returning a clean script with `[#s1]` matching `nguon.json`). Assert `nguon.json` and `kich-ban.md` are created and `gop.kiem_1(tmp_path)` returns `0`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline && uv run pytest tests/test_soan_tu_dong.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'tttc.soan_tu_dong'`.

- [ ] **Step 3: Implement `pipeline/tttc/soan_tu_dong.py`**

- Parse URLs from `chu-de.md`.
- Fetch article text and download up to 5 relevant `<img>` assets per source into `nguon/` (plus Playwright screenshot if available, non-fatal if Playwright fails).
- Call Gemini `generateContent` (`GEMINI_API_KEY`) to extract structured `nguon.json` (`id, ten, url, gia_tri, trich_dan`).
- Call Gemini to write 6-Beat `kich-ban.md` (2.000–2.400 words, `[#sN]` citations) and run `gop.kiem_1(v_dir)` up to 2 repair iterations.

- [ ] **Step 4: Run test to verify pass**

Run: `cd pipeline && uv run pytest tests/test_soan_tu_dong.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tttc/soan_tu_dong.py pipeline/tests/test_soan_tu_dong.py
git commit -m "feat(pipeline): add soan_tu_dong for automated source extraction and script generation via Gemini"
```

---

### Task 6: Tạo `pipeline/tttc/tao_anh.py` (Sinh ảnh AI phóng sự bằng `GEMINI_API_KEY` thay cho SVG tĩnh)

**Files:**
- Create: `pipeline/tttc/tao_anh.py`
- Test: `pipeline/tests/test_tao_anh.py` (Create)

**Interfaces:**
- Consumes: `GEMINI_API_KEY` from `.env`, scene prompt string
- Produces:
  - `sinh_anh_ai(video_dir: Path, filename: str, prompt: str, post_fn=None) -> Path | None` saving a 16:9 PNG/JPG into `videos/<slug>/anh/<filename>` (returns `None` gracefully on API error so the pipeline never crashes).

- [ ] **Step 1: Write failing tests in `pipeline/tests/test_tao_anh.py`**

Mock `post_fn` returning base64 image payload from Gemini/Imagen REST endpoint; assert image bytes are written to `tmp_path / "anh" / "scene-01.png"`. Also test that when `post_fn` raises `HTTPError`, `sinh_anh_ai` returns `None` without raising.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pipeline && uv run pytest tests/test_tao_anh.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Implement `pipeline/tttc/tao_anh.py`**

- Enforce editorial/documentary photojournalism style prefix in prompt (no text/watermarks in generated image, 16:9 aspect ratio).
- Read `GEMINI_API_KEY` from `os.environ` or `.env`.

- [ ] **Step 4: Run test to verify pass**

Run: `cd pipeline && uv run pytest tests/test_tao_anh.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tttc/tao_anh.py pipeline/tests/test_tao_anh.py
git commit -m "feat(pipeline): add tao_anh to generate editorial scene images via Gemini API"
```

---

### Task 7: Nâng cấp `tu_dong_dao_dien.py`, `chat_luong.py`, `dang.py`, và `chay_dai.py` (Bỏ SVG tĩnh, đồng bộ `#VnNews213`, khép kín `chay_dai`)

**Files:**
- Modify: `pipeline/tttc/tu_dong_dao_dien.py:1-241`
- Modify: `pipeline/tttc/chat_luong.py:19-24`
- Modify: `pipeline/tttc/dang.py:82-98`
- Modify: `pipeline/tttc/chay_dai.py:336-416`
- Test: `pipeline/tests/test_dao_dien_moi.py` (Create), `pipeline/tests/test_dang.py`, `pipeline/tests/test_chat_luong.py`

**Interfaces:**
- Consumes: `soan_tu_dong.tao_nguon_va_kich_ban`, `tao_anh.sinh_anh_ai`
- Produces:
  - `tu_dong_dao_dien.tao_dao_dien(v_dir, gemini_fn=None, image_fn=None)` producing `dao-dien.json` with **0** `minh-hoa` SVG scenes, mixing `trang-nguon`, `trich-bao`, `anh` (AI/real), `b-roll`, `nhan-vat`, `thoi-gian`, `ban-do`, `bieu-do`, `xep-hang`, `so-sanh`, `phan-tram`, `so-lon`, `quy-trinh`, `chu-dong`.
  - `chat_luong.MUC_TIEU` updated: `bang_chung: (0.08, 0.65)`, `stock_max: 0.45`, `do_hoa_min: 0.25`.
  - `dang.gan_hashtag` uses `#VnNews213` instead of `#NhipCongNghe`.
  - `chay_dai.py` calls `soan_tu_dong.tao_nguon_va_kich_ban` when `nguon.json` or `kich-ban.md` is missing, and fixes fallback `dang.upload(...)`.

- [ ] **Step 1: Write failing tests**

1. In `pipeline/tests/test_dao_dien_moi.py`: run `tao_dao_dien` on a sample `canh-khung.json` + `nguon.json` with mocked `gemini_fn` and `image_fn`; assert **no** scene uses `"mau": "minh-hoa"` and at least 3 distinct visual types (`trang-nguon`, `anh`, `chu-dong`/`trich-bao`/`so-lon`) are used.
2. In `pipeline/tests/test_dang.py`: assert `gan_hashtag("Mô tả", ["thoisu"])` contains `#VnNews213` and NOT `#NhipCongNghe`.
3. In `pipeline/tests/test_chat_luong.py`: assert a `canh.json` with 50% `bang-chung`, 25% `anh`/`b-roll`, and 25% `do-hoa` HTML/CSS passes `chat_luong.kiem`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pipeline && uv run pytest tests/test_dao_dien_moi.py tests/test_dang.py tests/test_chat_luong.py -v`
Expected: FAIL.

- [ ] **Step 3: Implement updates across `tu_dong_dao_dien.py`, `chat_luong.py`, `dang.py`, and `chay_dai.py`**

- Update `tu_dong_dao_dien.py` to use Gemini AI scene direction + `tao_anh.sinh_anh_ai` for `anh` scenes; fallback rule-based path also uses `trang-nguon`, `trich-bao`, `so-lon`, `chu-dong`, `anh` (never `minh-hoa` SVG).
- Update `chat_luong.py` `MUC_TIEU`.
- Update `dang.py` `gan_hashtag` default hashtag to `#VnNews213`.
- Update `chay_dai.py` `chay_pipeline_day_du` to call `soan_tu_dong.tao_nguon_va_kich_ban(v_dir)` if `nguon.json` or `kich-ban.md` does not exist, and fix `dang.dang_video` → `dang.upload`.

- [ ] **Step 4: Run full Python test suite**

Run: `cd pipeline && uv run pytest -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/tttc/tu_dong_dao_dien.py pipeline/tttc/chat_luong.py pipeline/tttc/dang.py pipeline/tttc/chay_dai.py pipeline/tests/
git commit -m "feat(pipeline): replace static SVG scenes with AI/real imagery + HTML/CSS data graphics and close chay_dai loop"
```

---

### Task 8: Dọn sạch 3 video lỗi/trùng trên kênh `@vnnews213` & Chạy kiểm thử tích hợp toàn hệ thống

**Files:**
- Create: `premium-text-to-video/scripts/cleanup-channel-errors.mjs` (one-off safe cleanup script with `--execute` flag)

**Interfaces:**
- Consumes: `getAuthenticatedYouTubeClient()` from `youtube-upload.mjs`
- Target IDs to delete permanently: `['lP4wQjjgLUI', '_brqvHH36ms', 'AEhSdL2yYK0']`

- [ ] **Step 1: Create `cleanup-channel-errors.mjs` (dry-run by default, deletes only with `--execute`)**

Write script that lists the 3 target IDs via `youtube.videos.list`, prints their title/views/duration, and calls `youtube.videos.delete({id})` when `--execute` is passed.

- [ ] **Step 2: Dry-run and then execute channel cleanup**

Run: `cd premium-text-to-video && node scripts/cleanup-channel-errors.mjs`
Verify the 3 exact videos (`lP4wQjjgLUI`, `_brqvHH36ms`, `AEhSdL2yYK0`), then run:
`cd premium-text-to-video && node scripts/cleanup-channel-errors.mjs --execute`
Expected: All 3 deleted cleanly (`204 No Content`).

- [ ] **Step 3: Run `yt-report.mjs` and full Node + Python test suites**

Run:
1. `cd premium-text-to-video && node scripts/yt-report.mjs`
2. `cd premium-text-to-video && npm test`
3. `cd pipeline && uv run pytest -v`
Expected: `data/performance.json` populated from YouTube API with Shorts + Long-form split; all Node and Python tests pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/cleanup-channel-errors.mjs data/performance.json
git commit -m "chore: clean up broken/duplicate YouTube videos and refresh performance report"
```
