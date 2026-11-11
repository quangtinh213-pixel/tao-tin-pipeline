# /tao-tin — Lấy tin mới, dựng video và đăng YouTube

Kích hoạt khi người dùng gõ `/tao-tin [số lượng]` hoặc chỉ gõ **"tạo tin"**.
Mặc định **5** bài. Agent tự chọn bài, tự chạy `/gen-video` cho từng bài, đăng
**public** lên kênh VNNews và báo kết quả qua Telegram. Không hỏi lại người dùng
giữa chừng trừ khi gặp blocker thật (thiếu key, YouTube chưa xác thực).

Helper: `scripts/tao-tin.mjs` (lọc tin, lưu tiến độ, ghi lịch sử, báo cáo).

## Bước 0 — Tiếp tục lượt dở (nếu có)

```bash
node scripts/tao-tin.mjs next
```

- Trả về một bài (`position`/`total`) → có lượt chưa xong: **bỏ qua Bước 1–2**,
  làm tiếp từ Bước 3 với bài đó.
- Trả về `null` → bắt đầu lượt mới.

## Bước 1 — Lấy ứng viên

```bash
node scripts/tao-tin.mjs candidates
```

JSON gồm `candidates` (tối đa 30 bài, đã lọc: đăng trong 12h, đúng domain báo,
chưa làm, chưa lỗi 2 lần) và `recentTitles` (video đã đăng 24h qua).
Nếu `candidates` rỗng: báo người dùng "không có tin mới phù hợp" và dừng.

## Bước 2 — Chọn bài

Lượt chạy theo lịch: N = số khung YouTube còn trống tới lượt sau
(`node scripts/tao-tin.mjs free-slots --until HH:MM`, tối đa 6). N = 0 → bỏ lượt,
vì video thêm vào chỉ xếp sau hàng đợi và lên sóng trễ cả ngày.

Agent tự chọn N bài (mặc định 5) theo tiêu chí:

- Nếu có `data/performance.json` (tạo bởi `npm run youtube:report`), đọc mục
  giữ chân tốt nhất/kém nhất trong tóm tắt và ưu tiên kiểu tin gần với nhóm tốt.

- **Trụ cột 70/30** (dữ liệu kênh: tin dân sinh giữ chân 58–69% người xem, tin số
  liệu kinh tế thường 0 đến vài chục view):
  - **Ưu tiên cao nhất: tin hot, gây "hóng biến"**, đang được bàn tán:
    - vi phạm pháp luật: bắt giữ, khởi tố, xét xử, triệt phá đường dây, lừa đảo;
    - tai nạn, sự cố nghiêm trọng;
    - sai phạm của cán bộ, doanh nghiệp, người nổi tiếng: tham nhũng, gian lận,
      hàng giả, thực phẩm bẩn, bị xử phạt;
    - xung đột, ẩu đả gây phẫn nộ; vụ việc có diễn biến bất ngờ hoặc tình tiết lạ.
  - Số liệu VN News (10/2026): tin trẻ em, tử vong, bắt giữ, người mất tích tạo
    ra gần hết video vượt 1.500 view. Tin cháy/nổ/tai nạn giữ chân kém nhất
    (~42%, chưa video nào vượt 1.500): chỉ chọn khi có con người cụ thể và kết
    cục chưa rõ, không chọn vụ cháy "không thương vong". Tin quốc tế (trung vị
    ~325 view) chỉ chọn khi liên quan trực tiếp tới người Việt hoặc Việt Nam.
  - ~70% số bài thuộc nhóm trên cùng **đời sống, sự cố bất ngờ, chuyện lạ/bí ẩn**
    (cảnh báo an toàn, câu chuyện khơi lòng trắc ẩn hoặc tò mò). Với 5 bài: ít
    nhất 3–4 bài nhóm này.
  - Giữa hai tin cùng nhóm, chọn tin có tình tiết cụ thể, kịch tính, quy mô lớn
    hoặc liên quan nhiều người hơn.
  - Chọn tin giật gân **không** đổi cách viết: kịch bản, tiêu đề, caption vẫn
    giữ quy tắc dữ kiện và ngôn ngữ pháp lý (nghi phạm, bị cáo buộc, đang điều
    tra) của template.
  - ≤ 30%: kinh tế/chính sách/văn hóa, chỉ khi tin có hệ quả trực tiếp tới túi
    tiền hoặc sinh hoạt người dân (giá cả, lương, phí, quy định mới áp dụng rộng).
  - **Không** chọn tin chỉ báo cáo số liệu: doanh thu, lãi lỗ doanh nghiệp, chỉ
    số vĩ mô, hội nghị. Thiếu bài nhóm 70% thì chọn ít bài hơn, không lấp chỗ
    bằng tin khô.
- Thử nghiệm chuỗi "Giá vàng hôm nay": tối đa 1 bài giá vàng mỗi ngày, tiêu đề
  luôn mở đầu bằng `Giá vàng hôm nay:` để người xem nhận ra chuỗi (tin giá cả có
  tỷ lệ đăng ký ổn định nhất). Đánh giá lại sau 2 tuần bằng `npm run youtube:report`.
- Tin mới; ưu tiên `hasImage: true`.
- Tối đa **2 bài mỗi báo** (`sourceId`).
- **Không** chọn 2 bài cùng một sự kiện; **không** chọn bài trùng sự kiện với
  `recentTitles`.
- Lý do mỗi bài ≤ 20 từ, tiếng Việt.

```bash
node scripts/tao-tin.mjs select '[{"index":3,"reason":"..."},{"index":7,"reason":"..."}]'
```

Lệnh in danh sách đã chọn; dán danh sách đó vào chat cho người dùng thấy.
Nếu báo "Lượt trước còn N bài chưa xong" → quay lại Bước 0 (chỉ dùng `--force`
khi người dùng yêu cầu bỏ lượt cũ).

## Bước 3 — Lặp từng bài (tuần tự, không song song)

Các lần `/gen-video` ghi chung `src/`, nên luôn làm **một bài một lúc**:

1. `node scripts/tao-tin.mjs next` → lấy `link` của bài kế tiếp. `null` → sang Bước 4.
2. Chạy toàn bộ pipeline `/gen-video` cho bài đó theo `docs/SKILL-GEN-VIDEO.md`,
   với `<context>` là `link`. Đây là trường hợp article URL: template
   `news/media-showcase`, `--audio=full`, áp dụng đầy đủ quy tắc lấy media của
   template. Ghi nhớ `<slug>` của video.
3. Render thành công (`videos/<slug>/output/video.mp4` tồn tại) → upload:
   ```bash
   node scripts/youtube-upload.mjs "<slug>"
   ```
   Lệnh không upload lại nếu `videos/<slug>/youtube.json` đã có (an toàn khi
   `YOUTUBE_AUTO_UPLOAD=true` đã upload trong `/gen-video`). Video được **hẹn
   giờ** vào khung vàng trống kế tiếp, cách nhau ≥ `YOUTUBE_PUBLISH_GAP_MINUTES` phút, mặc định 60 (xem
   `docs/SKILL-YOUTUBE-UPLOAD.md` §3.6), nên cả lượt không lên sóng dồn cùng lúc.
   Không dùng `--now` trong `/tao-tin`.
4. Ghi kết quả:
   ```bash
   # upload xong
   node scripts/tao-tin.mjs record --url "<link>" --status completed --slug "<slug>"
   # render xong nhưng upload lỗi (sẽ upload lại sau)
   node scripts/tao-tin.mjs record --url "<link>" --status rendered --slug "<slug>" --error "<lỗi ngắn>"
   # /gen-video thất bại sau khi đã tự sửa hợp lý
   node scripts/tao-tin.mjs record --url "<link>" --status failed --error "<lỗi ngắn>"
   ```
5. Báo một dòng tiến độ trong chat (`[2/5] ✅ <tiêu đề> → <url> (lên sóng HH:MM dd/MM)`),
   rồi quay lại 1.

Một bài lỗi **không** dừng cả lượt — ghi `failed` và làm bài tiếp theo.
Lỗi hết quota YouTube (`quotaExceeded`): ghi `rendered` cho bài đó, các bài sau
vẫn dựng nhưng **không** gọi upload, ghi `rendered`.

## Bước 4 — Tổng kết

```bash
node scripts/tao-tin.mjs finish
```

Gửi tổng kết qua Telegram (bỏ qua nếu chưa cấu hình `TELEGRAM_BOT_TOKEN` /
`TELEGRAM_CHAT_ID`) và in ra cùng nội dung — dán nguyên văn vào chat làm câu trả
lời cuối.

## Kiểm tra lịch đăng

`npm run youtube:check-schedule` cảnh báo qua Telegram khi 24 giờ tới có ít hơn
6 video đã hẹn giờ. Ngày không có video mới, lượt xem rơi về gần 0 (24–27/10:
45–116 view/ngày), nên chạy `/tao-tin` ngay khi nhận cảnh báo.

## Upload lại video tồn

Video ở trạng thái `rendered` trong `data/processed-news.json` có thể upload lại
bằng `node scripts/youtube-upload.mjs "<slug>"`.

## Constraints

- Không in giá trị `.env` hoặc token.
- Không chạy hai bài song song.
- Không ghi `completed` khi chưa có `videos/<slug>/youtube.json` (script sẽ từ chối).
- Trạng thái lượt: `data/tao-tin-run.json`; ứng viên: `data/tao-tin-candidates.json`.
