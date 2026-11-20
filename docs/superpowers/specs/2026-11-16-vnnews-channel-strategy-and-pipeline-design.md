# Thiết kế Tái cấu trúc Chiến lược Kênh VN News (`@vnnews213`) & Hợp nhất Pipeline Tự động (Cách 1)

**Ngày:** 2026-11-16  
**Phạm vi:** Chiến lược nội dung kênh YouTube `@vnnews213` + Mã nguồn `premium-text-to-video/` (Node.js/Remotion) + `pipeline/` (Python/HyperFrames).

---

## 1. Mục tiêu & Vì sao (Intent & Why)

### Hiện trạng dữ liệu thật (đo từ YouTube Data & Analytics API ngày 16/11/2026)
- Kênh `@vnnews213`: **270 sub**, **281.754 tổng view**, **483 video**.
- **97,0% view (175.821 / 181.200+ view trong 30 ngày)** đến từ **Shorts Feed**. Đề xuất/Browse cho video dài gần như bằng **0**.
- **Shorts:** Giữ chân tốt nhất (58–72% APV) và vượt 1.500–2.996 view ở các tin **mất tích/cứu nạn, bất thường học đường/y tế, đại án lừa đảo tiền tỷ**. Ngược lại, các chùm Shorts đăng dồn cách nhau 30 phút bị chết phân phối (2–9 view), và đang có video lỗi lọt lên kênh public (`lP4wQjjgLUI` 0 giây, `_brqvHH36ms` tiêu đề slug, 1 bản trùng *Sập mố cầu Bái Sim*).
- **Video dài 16:9:** 6 video dài đăng gần đây (10–12/11) chỉ đạt **8–59 view** (thời lượng ngắn 3:08–6:39, chủ đề khô hoặc trùng lặp). Hai video mới render bằng HyperFrames (*Starship/Starlink VN* 8:09 và *Vành đai 3 TP.HCM*) đang kẹt ở trạng thái chưa upload (`dang: chua-chay`).
- **4 điểm nghẽn mã nguồn:**
  1. `daily-orchestrator.mjs` khóa cứng vào `agy` CLI → khi `agy` hết quota (429, khóa 164h ngày 15/11), toàn bộ dây chuyền tự động tê liệt dù `.env` đã có `GEMINI_API_KEY` và `GROQ_API_KEY`.
  2. Đứt mạch giữa Node và Python: `tao-video-dai.mjs` tạo thư mục rỗng rồi gọi `tttc.chay_dai`, nhưng `chay_dai.py` thiếu bước tự động cào nguồn (`nguon.json`) + viết kịch bản (`kich-ban.md`). Ngược lại, khi `chay_dai.py` gọi `youtube-upload.mjs`, `youtube-upload.mjs` không thấy `spec.json` của Remotion nên gán nhầm video dài thành `#Shorts`.
  3. `yt-report.mjs` chỉ đọc thư mục `videos/` trên ổ cứng (đã bị dọn ngày 13–14/11) nên báo cáo bị mù, chỉ thấy 1 video.
  4. Lẫn thương hiệu (`#NhipCongNghe` trong `pipeline/tttc/dang.py`) và thiếu cầu nối từ Shorts sang Video dài.

### Định hướng mục tiêu
Xây dựng mô hình **"Một trục nội dung – Phễu hai tầng"** cho `@vnnews213`:
- **Trục duy nhất:** Thời sự dân sinh – Hồ sơ đại án/pháp luật – Giải thích quyền lợi thiết thân.
- **Tầng 1 (Shorts — Phễu thu hút):** 6–8 video/ngày (30–42s), giữ `news/media-showcase` (ảnh/video hiện trường thật), giãn cách đăng **tối thiểu 90 phút** (`YOUTUBE_PUBLISH_GAP_MINUTES=90`), bổ sung cổng kiểm duyệt trước upload để không bao giờ lọt video 0s hoặc tiêu đề slug.
- **Tầng 2 (Video dài 16:9 — Phễu giữ chân & chuyển đổi):** 3–4 video/tuần (8–11 phút, khung 12:00 hoặc 15:30 — tránh vùng chết 17:00–21:00 theo `dang.py`), dùng **`pipeline/tttc` (HyperFrames)** nâng cấp theo phong cách **"Hồ sơ điều tra & Bằng chứng báo chí"**. Chỉ làm các đại án/sự kiện dân sinh có nhiều báo đưa tin hoặc có Shorts trên kênh vừa đạt ≥1.000 view, sau đó nối trực tiếp từ Shorts sang Video dài.

### Non-goals & Anti-goals
- **Non-goal:** Không thay thế engine Shorts (`news/media-showcase` trên Remotion) bằng HyperFrames.
- **Non-goal:** Không tự động xóa video cũ hàng loạt khi chưa xác định đúng ID lỗi; chỉ xử lý đúng danh sách video lỗi/trùng đã xác minh (hoặc cung cấp script dọn có dry-run/xác nhận).
- **Anti-goal:** Không để kênh tiếp tục đăng video 0s, tiêu đề slug thô, trùng bài, hoặc video dài < 7 phút không có lý do; không để `agy` quota 429 làm dừng lịch sản xuất hằng ngày.

---

## 2. Các cách tiếp cận đã xem xét (Approaches)

1. **Cách 1 (Đã chọn):** Hợp nhất điều phối "Hai luồng độc lập + Tự động Fallback `agy` ↔ `Gemini API` + Nâng cấp HyperFrames Hồ sơ điều tra + Cầu nối Shorts → Long". Giữ nguyên sức mạnh Shorts hiện trường trên Remotion, khép kín pipeline tự động của `pipeline/tttc` bằng `GEMINI_API_KEY`, sửa cổng upload/báo cáo và gắn cầu nối khán giả.
2. **Cách 2 (Loại):** Chuyển cả Shorts và Video dài về `pipeline/tttc` (bỏ Remotion). Loại vì làm mất định dạng slideshow hiện trường đang kéo 97% view của kênh.
3. **Cách 3 (Loại):** Chỉ vá lỗi lọc tin, báo cáo và upload, vẫn phụ thuộc `agy` CLI. Loại vì không giải quyết được tình trạng tê liệt khi `agy` hết quota.

---

## 3. Kiến trúc & Các phần thay đổi (Design)

### 3.1. Chống sập lịch khi `agy` hết quota (`daily-orchestrator.mjs`, `auto-news-pipeline.mjs`, `agy-runner.mjs`)
- **Cơ chế Fallback tự động:**
  - Trong `daily-orchestrator.mjs`: khi `checkAgyPreflight()` không sẵn sàng hoặc `runAgyTaoTin()` / `runAgyTaoVideoDai()` ném lỗi có dấu hiệu quota/unavailable (`RESOURCE_EXHAUSTED`, `429`, `Individual quota reached`, mã thoát 3), hệ thống **tự động chuyển sang chế độ Direct API** (không dừng ca):
    - **Với Shorts:** Gọi `runAutoNewsBatch({count: shift.shorts, lockFile: null, ...})` vốn đã có sẵn trong `auto-news-pipeline.mjs` (dùng `GEMINI_API_KEY` để rank/viết kịch bản, không phụ thuộc `agy`).
    - **Với Video dài:** Gọi thẳng `node scripts/tao-video-dai.mjs` (hoặc Python `tttc.chay_dai`), vì phần 3.2 bên dưới sẽ giúp `pipeline/tttc` tự tạo `nguon.json` và `kich-ban.md` bằng `GEMINI_API_KEY` mà không cần `agy`.
- **Giãn lịch & Giảm tải hợp lý (tự chốt để khớp 8 slot/ngày & tránh vùng chết):**
  - Cập nhật `DEFAULT_PUBLISH_GAP_MINUTES = 90` trong `youtube-upload.mjs` (khớp với `.env` `YOUTUBE_PUBLISH_GAP_MINUTES=90`), khung giờ Shorts mặc định rút về 8 khung cách đều trong ngày (`07:00, 09:00, 11:30, 13:30, 15:30, 17:30, 19:30, 21:30`).
  - Giảm `DAILY_SHIFTS` trong `daily-orchestrator.mjs` từ 10 xuống **8 Shorts/ngày** (Ca 1–4 mỗi ca **2 Shorts**) để khớp 1:1 với 8 khung giờ, tránh dồn lịch sang ngày hôm sau.
  - Khung giờ Video dài (`DEFAULT_LONG_PUBLISH_SLOTS`): đặt `12:00,15:30` (khớp cảnh báo tránh vùng chết 17:00–21:00 trong `pipeline/tttc/dang.py`).
  - Lịch Video dài trong `daily-orchestrator.mjs`: **tối đa 1 video dài/ngày** cho mọi ngày; ngày chẵn chạy bình thường nếu đạt ngưỡng (≥45 điểm), ngày lẻ chỉ chạy khi có tin đặc biệt đạt **≥55 điểm** (mục tiêu 3–4 video dài/tuần).

### 3.2. Khép kín & Nâng cấp Video dài `pipeline/tttc` ("Hồ sơ điều tra & Bằng chứng báo chí")
- **Bước tự động thu thập nguồn & viết kịch bản (`pipeline/tttc/soan_tu_dong.py`):**
  - Được gọi tự động ở đầu `chay_dai.py` nếu thư mục `videos/<slug>` chưa có `nguon.json` hoặc chưa có `kich-ban.md`.
  - Đọc danh sách URL nguồn từ `chu-de.md` (do `tao-video-dai.mjs` ghi từ `long-queue.json`).
  - Cào nội dung bài báo (text + ảnh bài báo vào `nguon/` + chụp ảnh màn hình bài báo bằng Playwright nếu có), trích xuất các sự kiện/số liệu có nguồn thành `nguon.json` (dùng `GEMINI_API_KEY` từ `.env` để bóc tách JSON chuẩn schema `id, ten, url, gia_tri, trich_dan`).
  - Gọi Gemini API sinh `kich-ban.md` (6 Beat, 2.000–2.400 từ, gắn thẻ `[#s1]`, `[#s2]`... cho mọi số liệu, giữ nguyên quy tắc `phong_cach` và `tieu_de`).
  - Chạy vòng tự sửa tối đa 2 lần qua `gop.kiem_1(v_dir)`: nếu còn lỗi từ cấm hoặc lệch số liệu nguồn, gửi chính danh sách lỗi đó lại cho Gemini để sửa trước khi đi tiếp sang bước `giong`.
- **Nâng cấp Đạo diễn sáng tạo & đa phương tiện — bỏ hoàn toàn SVG minh họa (`pipeline/tttc/tu_dong_dao_dien.py`, `dung.py`, `chat_luong.py`):**
  - **Đạo diễn AI theo từng kịch bản (thay vòng lặp `i % 4` & `VALID_SVGS` cứng):** Dùng Gemini API (hoặc `agy` khi khả dụng) đóng vai Đạo diễn hình ảnh đọc từng câu trong `canh-khung.json` + `nguon.json` + danh sách ảnh/video đã thu thập để chủ động thiết kế `dao-dien.json`, chỉ giữ hàm chia cứng làm fallback khi mất mạng.
  - **Thay toàn bộ `minh-hoa` SVG bằng Ảnh AI (`GEMINI_API_KEY`) + Ảnh/B-roll thật + Đồ họa dữ liệu HTML/CSS:**
    - *Ảnh AI theo ngữ cảnh (`tttc/tao_anh.py` dùng `GEMINI_API_KEY`):* Với các cảnh mô phỏng bối cảnh/ẩn dụ không có ảnh báo thật (phiên tòa, đường dây, kho hàng, hiện trường...), tự động gọi Gemini Image Generation / Imagen tạo ảnh raster phong cách phóng sự/tài liệu, lưu vào `videos/<slug>/anh/` và hiển thị qua mẫu `anh` (có chuyển động máy quay Ken Burns mượt mà).
    - *Bằng chứng & Hiện trường thật:* `trang-nguon` (ảnh/chụp bài báo), `trich-bao` (trích nguyên văn tô vàng), `nhan-vat` (ảnh từ Wikimedia `tttc.anh`), `b-roll` (clip/ảnh từ `broll-kho/` hoặc ảnh hiện trường báo chí).
    - *Đồ họa dữ liệu HTML/CSS thuần:* `thoi-gian` (timeline vụ án), `ban-do` (bản đồ địa điểm sự kiện), `bieu-do` / `xep-hang` / `so-sanh` / `phan-tram` / `so-lon` (số liệu), `quy-trinh` (sơ đồ đường dây/thủ đoạn), `chu-dong` (chữ động khớp nhịp nói), kết hợp `boi` (nhãn/tem) và `tong` (đổi bảng màu theo chương). Không dùng `minh-hoa` SVG tĩnh trong luồng tự động.
  - **Đồng bộ cổng kiểm tra chất lượng (`pipeline/tttc/chat_luong.py` — tự chốt kỹ thuật):** Nới `MUC_TIEU` cho phép `bang_chung` tối đa **65%**, `doi_that` / ảnh minh họa (`anh`, `b-roll`, `nhan-vat`) tối đa **45%**, và đồ họa dữ liệu HTML/CSS (`do_hoa_min`) tối thiểu **25%**, đảm bảo `gop.kiem_canh` không chặn phong cách phóng sự đa phương tiện mới.
- **Đồng bộ thương hiệu & sửa lỗi `chay_dai.py`:**
  - Trong `pipeline/tttc/dang.py`: thay `#NhipCongNghe` thành `#VnNews213` (đọc từ `pipeline/config.json:channel.hashtags` làm ưu tiên).
  - Trong `pipeline/tttc/chay_dai.py`: sửa dòng gọi fallback `dang.dang_video` (hiện đang sai tên hàm, hàm thật là `dang.upload`).

### 3.3. Mở khóa bộ lọc đề tài Video dài & Cầu nối Shorts ↔ Video dài
- **Bộ lọc `long-news-filter.mjs`:**
  - Tách `SENSITIVE` thành:
    - `SENSITIVE_GRAPHIC` (vẫn chặn): án mạng đẫm máu đơn lẻ, hiếp dâm, xâm hại, tự tử, tai nạn nhỏ lẻ.
    - `MAJOR_CASE_OR_PUBLIC_IMPACT` (mở khóa & cộng điểm `+12`): đại án lừa đảo, khởi tố/bắt giữ cán bộ/doanh nghiệp lớn, đường dây quy mô lớn, sự cố hạ tầng/y tế/học đường ảnh hưởng rộng.
  - Thêm tín hiệu **ưu tiên cộng điểm (`+15`)** nếu chủ đề đó khớp với một Short trên kênh `@vnnews213` vừa đạt ≥1.000 view trong 7 ngày gần nhất (từ `data/performance.json`).
- **Cầu nối upload & chuyển đổi (`youtube-upload.mjs`):**
  - Sửa `isLongFormSpec`: ngoài kiểm tra `spec.json` của Remotion, kiểm tra thêm `canh.json` + `final.mp4` (hoặc `ffprobe` tỷ lệ khung hình `width > height` / thời lượng ≥ 180s) của HyperFrames để **không bao giờ gán `#Shorts` cho video dài `pipeline/tttc`**. Đọc `mo-ta.txt`, `phu-de.srt`, `thumbnails/` từ thư mục video HyperFrames nếu `spec.json` không tồn tại.
  - **Cổng chặn video lỗi trước upload (Pre-upload Gate):** Từ chối upload nếu `ffprobe` đo thời lượng `< 5s` (chặn lỗi 0 giây như `lP4wQjjgLUI`) hoặc tiêu đề chứa dấu gạch ngang dạng slug (`^[a-z0-9-]+$` không dấu cách, chặn lỗi `_brqvHH36ms`).
  - **Tự động nối Shorts → Video dài (tự chốt kỹ thuật vì YouTube API không có tính năng ghim bình luận):** Khi upload một Video dài thành công, tìm các Shorts đã upload trong 14 ngày gần nhất có chung từ khóa/sự kiện (so token tiêu đề ≥ 2 từ khóa đặc trưng) và gọi `youtube.videos.update` để **chèn link lên dòng đầu mô tả** của các Short đó (`👉 Xem hồ sơ phân tích đầy đủ: https://youtu.be/<long_vid>` — đảm bảo idempotent, không chèn trùng). Đồng thời gửi thông báo Telegram liệt kê các Short vừa nối để bạn gắn `Related Video` trong YouTube Studio chỉ với 1 cú click.

### 3.4. Khôi phục `yt-report.mjs` & Dọn dẹp kênh
- **Sửa `yt-report.mjs`:**
  - Thay vì chỉ quét thư mục `videos/` trên ổ cứng (bị mất khi dọn disk), `readUploadedVideos` lấy danh sách video trực tiếp từ `uploads` playlist của kênh qua YouTube Data API (`channels.list` + `playlistItems.list` + `videos.list`), kết hợp metadata cục bộ trong `videos/` nếu còn.
  - Phân tách rõ thống kê **Shorts vs Long-form** (số lượng, tổng view, APV trung vị, giữ chân 30s) trong `data/performance.json` và bản tóm tắt Telegram.
- **Dọn dẹp & xử lý tồn đọng trên kênh (theo quyết định của chủ kênh):**
  - **Xóa vĩnh viễn (`videos.delete`)** 3 video lỗi/trùng đang public trên kênh: `lP4wQjjgLUI` (0 giây), `_brqvHH36ms` (tiêu đề slug `podcast-den-noi-quan-dong-cua-v2 #Shorts`), và `AEhSdL2yYK0` (bản trùng *Sập mố cầu Bái Sim*, giữ `CxXuotQm2rs` 20 view).
  - **Bỏ qua không đăng** cả 2 video dài cũ đang nằm trên ổ cứng (`2026-11-16-starship-starlink-vn` và `2026-11-16-vanh-dai-3-tphcm-thong-xe`) để kênh khởi động sạch đúng trục nội dung và quy trình mới.

---

## 4. Những phần để cho người lập kế hoạch / thực thi tự quyết (Left to the Builder)
- Cấu trúc chi tiết prompt gọi Gemini API trong `soan_tu_dong.py` (miễn output qua được `gop.kiem_1` và schema `nguon.json` / `kich-ban.md`).
- Cách tổ chức unit test bằng Node test / `vitest` và `pytest` cho các hàm mới/đã sửa.
- Chi tiết thuật toán khớp từ khóa giữa Short và Long khi gắn link chéo (có thể tái sử dụng `tokenize` / `sameStory` từ `long-news-filter.mjs`).
