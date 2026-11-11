# /youtube-upload [--latest] [--all] [--watch] [--force] [--now] [<slug>]

Hướng dẫn chi tiết về quy trình tự động tải video mới lên kênh YouTube **VNNews** (`#VnNews213`) sử dụng YouTube Data API v3 chính thống của Google.

---

## 1. Thiết lập ủy quyền OAuth 2.0 (Chỉ làm 1 lần)

Để tải video lên YouTube thông qua API, Google yêu cầu tạo một **OAuth 2.0 Client ID** có quyền truy cập YouTube:

### Bước 1: Tạo Credentials trên Google Cloud Console
1. Đăng nhập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn hoặc tạo mới 1 dự án (ví dụ: `VNNews Video Studio`).
3. Vào **APIs & Services** > **Library**, tìm `YouTube Data API v3` và nhấn **Enable** (Bật).
4. Vào **APIs & Services** > **OAuth consent screen**:
   - Chọn loại: **External**.
   - Nhập Tên ứng dụng và email liên hệ.
   - Thêm Scopes: `../auth/youtube.upload` và `../auth/youtube.readonly`.
   - Thêm Test Users: Nhập địa chỉ Gmail sở hữu kênh VNNews.
5. Vào **APIs & Services** > **Credentials**:
   - Nhấn **Create Credentials** > **OAuth client ID**.
   - Loại ứng dụng: **Web application**.
   - Trong mục **Authorized redirect URIs**, thêm:
     `http://localhost:8910/oauth2callback`
   - Nhấn **Create** để lấy Client ID và Client Secret.

### Bước 2: Lưu Client ID và Client Secret vào `.env`
Chạy hai lệnh sau trong terminal:
```bash
node scripts/update-config.mjs --key YOUTUBE_CLIENT_ID --value "<YOUR_CLIENT_ID>"
node scripts/update-config.mjs --key YOUTUBE_CLIENT_SECRET --value "<YOUR_CLIENT_SECRET>"
```

### Bước 3: Chạy lệnh ủy quyền
```bash
npm run youtube:auth
```
- Trình duyệt sẽ tự động mở trang đăng nhập Google.
- Chọn tài khoản quản lý kênh YouTube **VNNews** và bấm Cho phép (Allow).
- Hệ thống sẽ tự động lưu `YOUTUBE_REFRESH_TOKEN` vào file `.env` và hiển thị thông tin xác nhận kênh YouTube.

---

## 2. Bật chế độ Tự Động Upload sau Render

Để mỗi khi tạo video xong (qua `/gen-video` hoặc Web Dashboard), video tự động được upload lên kênh YouTube VNNews mà không cần thao tác thêm:

```bash
node scripts/update-config.mjs --key YOUTUBE_AUTO_UPLOAD --value true
```

---

## 3. Các lệnh Upload thủ công & chế độ Watcher

### 3.1. Upload 1 video cụ thể theo slug
```bash
node scripts/youtube-upload.mjs "<slug>"
```
Ví dụ:
```bash
node scripts/youtube-upload.mjs 2026-09-22-tuoitre-vn-phat-hien-71-bo-hai-cot-liet-si
```

### 3.2. Upload video vừa mới render xong gần nhất
```bash
node scripts/youtube-upload.mjs --latest
```
hoặc:
```bash
npm run youtube:upload
```

### 3.3. Upload tất cả các video chưa tải lên
```bash
node scripts/youtube-upload.mjs --all
```

### 3.4. Chế độ ngầm Watcher (Daemon)
Tự động giám sát thư mục `videos/` và ngay khi có video render xong sẽ tự động upload:
```bash
npm run youtube:watch
```

### 3.5. Tùy chọn thêm
- `--force`: Upload lại kể cả khi video đã có bản ghi `youtube.json`.
- `--privacy <public|unlisted|private>`: Chọn chế độ hiển thị (công khai, không công khai hoặc riêng tư). Mặc định đọc từ `YOUTUBE_PRIVACY_STATUS` trong `.env` (mặc định là `public`).
- `--now`: Đăng public ngay, bỏ qua hẹn giờ khung vàng.

### 3.6. Hẹn giờ đăng theo khung vàng (mặc định)
Video `public` **không** lên sóng ngay: script upload ở chế độ `private` kèm
`publishAt`, YouTube tự chuyển sang public đúng giờ. Khung giờ (giờ Việt Nam)
lấy từ `YOUTUBE_PUBLISH_SLOTS`, mặc định 07:00–07:30, 11:30–13:00 (lưới 30 phút),
15:30, 16:30, 18:00–19:30, 21:00–22:30 (sáng đi làm, nghỉ trưa, chiều, tan sở, trước khi ngủ). Mỗi
video nhận khung trống sớm nhất, cách mọi video đã đăng/đã hẹn ít nhất
`YOUTUBE_PUBLISH_GAP_MINUTES` phút (mặc định **60**) và cách hiện tại ít nhất 15
phút; hết khung trong ngày thì sang ngày hôm sau. Với 60 phút: tối đa 9 video
mỗi ngày; đặt 30 phút: tối đa 16 video mỗi ngày.

- Đặt `YOUTUBE_PUBLISH_SLOTS=off` hoặc dùng `--now` để đăng ngay như trước.
- Link `youtu.be` trả về ngay nhưng chỉ xem được sau giờ lên sóng.

---

## 4. Cơ chế hoạt động & Metadata

- **Tiêu đề (Title)**: Lấy từ `spec.json` (`video.title`). Tự động gắn tag `#Shorts` cho video ngắn dạng dọc, đảm bảo độ dài không vượt quá 100 ký tự (chuẩn tối đa của YouTube).
- **Mô tả (Description)**: Sử dụng trọn vẹn nội dung từ `caption.txt` (bao gồm câu Hook, chi tiết tin tức, nguồn tin chính thống, lời kêu gọi thảo luận mở và hashtag `#VnNews213`).
- **Thẻ (Tags)**: Tự động trích xuất các hashtag từ `caption.txt` và bổ sung các tags mặc định: `VNNews`, `VnNews213`, `tintuc`, `Shorts`.
- **Chống trùng lặp**: Sau khi upload thành công, hệ thống tạo file `videos/<slug>/youtube.json`:
  ```json
  {
    "videoId": "abc123xyz",
    "url": "https://youtu.be/abc123xyz",
    "title": "Phát hiện 71 bộ hài cốt liệt sĩ trong vườn sầu riêng #Shorts",
    "privacyStatus": "private",
    "publishAt": "2026-09-23T11:00:00.000Z",
    "categoryId": "25",
    "uploadedAt": "2026-09-22T16:30:00.000Z",
    "slug": "2026-09-22-tuoitre-vn-phat-hien-71-bo-hai-cot-liet-si"
  }
  ```
  Khi chạy lại, hệ thống sẽ kiểm tra file này và tự động bỏ qua để tránh trùng lặp.
