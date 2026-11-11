# /tao-video-dai — Chọn tin hot, dựng video dài 16:9 và hẹn giờ đăng

Kích hoạt khi người dùng gõ `/tao-video-dai [số lượng]` hoặc "tạo video dài".
Mặc định **2** video (đúng nhịp 2 video/ngày). Mỗi video dùng template
`news/long-explainer`, hẹn đăng vào khung 12:00 hoặc 20:00 (giờ Việt Nam).

Helper: `scripts/long-news-filter.mjs` (bộ lọc tin + hàng đợi), logic giờ đăng
trong `scripts/youtube-upload.mjs` (`longSlotOptions`).

## Quy tắc chạy

- **Chạy tuần tự, một lượt một lúc.** Mỗi video ghi đè `src/VideoContent.tsx` và
  `src/Root.tsx`, nên không chạy cùng lúc với `/tao-tin`, `auto-news` hay một
  `/gen-video` khác.
- Không hỏi lại giữa chừng trừ khi gặp blocker thật (thiếu key, YouTube chưa
  xác thực, không đủ nguồn).
- Video được tải lên **private + hẹn giờ công khai** (`publishAt`), nên còn một
  khoảng thời gian để người dùng xem lại trên YouTube Studio trước khi lên sóng.

## Bước 1 — Lọc tin

```bash
node scripts/long-news-filter.mjs --count <N>
```

Ghi `data/long-queue.json`. Bộ lọc chạy không cần LLM hay API key: đọc RSS 8 báo
(Tuổi Trẻ, VnExpress, Dân Trí, Thanh Niên, VietnamNet, Zing News, CafeF,
VnEconomy) + Google Trends VN, gom các bài cùng sự kiện, rồi chấm điểm 100:

| Tiêu chí | Điểm | Ý nghĩa |
|---|---:|---|
| Độ phủ | 0–40 | số báo khác nhau cùng đưa tin (Google Trends tính thêm các báo trong xu hướng) |
| Xu hướng | 0–20 | từ khóa khớp Google Trends VN, theo lượng tìm kiếm |
| Độ chạm | 0–25 | liên quan tới lương, giá cả, thuế phí, quy định mới, nhà đất, thời tiết, sức khỏe, giáo dục, giao thông, an ninh mạng… (xem `REACH_LEXICON`) |
| Giải thích được | 0–10 | có câu hỏi "vì sao/ra sao/ảnh hưởng gì", mốc hiệu lực, con số |
| Độ mới | 0–5 | tin càng mới càng cao |

Cổng loại cứng (không đạt thì không vào hàng đợi, dù điểm cao):

- Chưa đủ "hot": cần ≥3 báo, hoặc 2 báo + khớp Google Trends.
- Điểm dưới 45; tin quá 36 giờ; độ chạm dưới 12.
- Tin hình sự/tai nạn/bạo lực (để cho Shorts; `--allow-legal` để mở lại).
- Giải trí, thể thao, quảng cáo, tử vi.
- Đã có video dài về cùng sự kiện (so tiêu đề và URL với `videos/*`).

Chọn N tin có **đa dạng chủ đề**: tin thứ hai ưu tiên chủ đề khác tin thứ nhất,
trừ khi kém hơn hơn 12 điểm. Mỗi tin kèm danh sách nguồn (`sources`, đã có ≥2
báo) và `publishSlot` dự kiến.

Hàng đợi rỗng → báo "không có tin đủ chuẩn" và dừng; **không hạ chuẩn để đủ số**.

## Bước 2 — Với từng tin (tuần tự)

1. Dựng `context` gồm link chính (tin điểm cao nhất, báo uy tín nhất) + 2–4 link
   phụ lấy từ `sources` + một dòng câu hỏi giải thích cho video.
2. Chạy `/gen-video --template news/long-explainer --audio=music <context>` theo
   `docs/templates/news/long-explainer.md` (nguồn → kịch bản → giọng → spec → caption → render).
3. Nếu `YOUTUBE_AUTO_UPLOAD=true`, bước upload của `/gen-video` tự chọn khung
   12:00/20:00 còn trống. Nếu thất bại, ghi lại slug và để người dùng đăng bằng
   `node scripts/youtube-upload.mjs "<slug>"`.
4. Không đăng Facebook Reel (video dài tự bị bỏ qua).

## Bước 3 — Cổng chất lượng trước khi coi là xong

- Mọi số liệu trong video có trong bài nguồn; tiêu đề không hứa hơn nội dung.
- Kịch bản đạt `script-rules.mjs --max-words=2200`; spec đạt `validate-long-explainer.mjs`.
- Đã xem khung hình đầu, một thẻ chương, một cảnh số liệu và cảnh cuối.
- Sai ở cổng nào thì sửa hoặc **bỏ video đó**, không đăng bản chưa đạt.

## Báo cáo

Cuối lượt, liệt kê từng tin: tiêu đề, điểm, slug, giờ hẹn đăng, và cổng nào
chưa đạt (nếu có). Đề xuất bước tiếp theo.

## Cấu hình

| Biến `.env` | Mặc định | Ý nghĩa |
|---|---|---|
| `YOUTUBE_LONG_PUBLISH_SLOTS` | `12:00,20:00` | khung giờ đăng video dài (giờ VN) |
| `YOUTUBE_LONG_PUBLISH_GAP_MINUTES` | `240` | khoảng cách tối thiểu giữa hai video dài |

Khung giờ là giả định ban đầu; chỉnh lại sau 2 tuần theo số liệu giữ chân thật.
