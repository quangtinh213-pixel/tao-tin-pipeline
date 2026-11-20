# /tao-video-dai — Chọn tin hot, dựng video dài 16:9 và hẹn giờ đăng

Kích hoạt khi người dùng gõ `/tao-video-dai [số lượng]` hoặc "tạo video dài".
Mặc định **2** video/ngày (khung 12:00 và 20:00 giờ Việt Nam).

Được vận hành bởi **Pipeline HyperFrames thu gọn** (`pipeline/tttc`), mang lại chất lượng kịch bản có trích nguồn chuẩn xác, đồ họa isometric 1080p, thời gian render siêu nhanh (~3–5 phút) và hoàn toàn tự động.

## Kiến trúc Pipeline thu gọn

Pipeline kế thừa hệ thống của dự án Youtube nhưng được tinh giản cho chế độ tự động hoá:
- **Nguồn tin & Radar:** Đọc tin từ 8 báo lớn + Google Trends (`scripts/long-news-filter.mjs`) ghi vào `data/long-queue.json`.
- **Trích nguồn:** Đọc nguồn gốc, trích xuất số liệu vào `nguon.json`, chụp ảnh bằng chứng tự động.
- **Kịch bản:** 6 Beat (~2.000–2.500 từ, thời lượng 8–11 phút). Mọi câu có số liệu đều gắn trích dẫn `[#id]`.
- **Bộ lọc phong cách & kiểm tra:** Kiểm tra 0 từ cấm (`tu-cam.json`), kiểm tra nhịp điệu (`tttc.phong_cach`), đối chiếu 100% số liệu với nguồn gốc (`tttc.kiem`), chấm điểm tiêu đề (`tttc.tieu_de`).
- **Giọng đọc & Mốc từ:** VieNeu-TTS / ElevenLabs đồng bộ mốc thời gian từng từ (`giong-timing.json`).
- **Đạo diễn & Cảnh:** 80–120 cảnh, đồ thị cảm xúc, 30% cảnh cao trào có chuyển động/ẩn dụ, 17 mẫu cảnh HyperFrames (`minh-hoa`, `bieu-do`, `so-lon`, `trang-nguon`, `trich-bao`, `nhan-vat`, `chuong`).
- **Render:** HyperFrames render trực tiếp 1080p 30fps (`final.mp4`), kiểm tra hình tiếng (`check_av`).
- **Thumbnail & Xuất bản:** Thumbnail 1280x720 độ tương phản cao, SRT phụ đề, mô tả kèm mốc chương. Tự động hẹn giờ trên YouTube (12:00 / 20:00).

## Quy tắc chạy

- **Chạy tuần tự, một lượt một lúc.**
- **Chế độ tự động hoàn toàn (--auto):** Tự động duyệt qua các cổng khi kịch bản và cảnh sạch lỗi, không nghẽn bởi các điểm duyệt thủ công (phục vụ Task Scheduler / daily-orchestrator).
- **Chế độ duyệt thủ công (--review):** Dừng tại `duyet-1.html` (duyệt kịch bản) và `duyet-2.html` (duyệt bản dựng và chọn tiêu đề/thumbnail).

## Cách thực thi

### Cách 1: Chạy nhanh qua Node helper (Khuyên dùng)
```bash
# Tự động lấy tin điểm cao nhất từ hàng đợi và chạy toàn bộ pipeline
node scripts/tao-video-dai.mjs

# Chạy cho một video cụ thể
node scripts/tao-video-dai.mjs 2026-11-15-thoi-tiet-10-ngay-toi-khong-khi-lanh

# Chạy có điểm dừng để duyệt tay
node scripts/tao-video-dai.mjs --review
```

### Cách 2: Chạy trực tiếp qua Python CLI trong `pipeline/`
```bash
cd pipeline

# Chạy tự động trọn gói
uv run python -m tttc.chay_dai <slug> --auto

# Chạy từng bước cụ thể
uv run python -m tttc.chay_dai <slug> --step kiem      # Kiểm tra kịch bản & đối chiếu nguồn
uv run python -m tttc.chay_dai <slug> --step giong     # Tạo giọng đọc & mốc từ
uv run python -m tttc.chay_dai <slug> --step canh      # Chia cảnh & đạo diễn
uv run python -m tttc.chay_dai <slug> --step render    # Render HyperFrames ra final.mp4
uv run python -m tttc.chay_dai <slug> --step dong-goi  # Tạo thumbnail & SRT
uv run python -m tttc.chay_dai <slug> --step dang      # Upload YouTube hẹn giờ
```

## Cổng chất lượng bắt buộc trước khi xuất bản

1. **Kịch bản:** `gop.kiem_1` đạt 0 lỗi (0 từ cấm, không mở/kết sáo rỗng, tiêu đề ≥ 8/10).
2. **Số liệu:** 100% số liệu trong kịch bản có thẻ `[#id]` trỏ vào `nguon.json`.
3. **Cảnh:** `gop.kiem_canh` đạt 0 lỗi, cảnh cắt 2.5–4.5s/cảnh, không có 3 cảnh liền cùng mẫu.
4. **Hình-tiếng:** `check_av` khớp độ dài hình và tiếng (chênh lệch ≤ 0.5s).

## Cấu hình

| Biến `.env` / `config.json` | Mặc định | Ý nghĩa |
|---|---|---|
| `YOUTUBE_LONG_PUBLISH_SLOTS` | `12:00,20:00` | Khung giờ đăng video dài (giờ VN) |
| `YOUTUBE_AUTO_UPLOAD` | `true` | Tự động tải lên YouTube chế độ riêng tư + hẹn giờ |
| `ELEVENLABS_API_KEY` | (tuỳ chọn) | Nếu không có, hệ thống dùng VieNeu-TTS chạy local |
