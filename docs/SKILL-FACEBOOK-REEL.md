# /facebook-reel [--latest] [--all] [--force] [<slug>]

Đăng video đã render (`videos/<slug>/output/video.mp4`) lên Facebook Page dạng
Reel qua Graph API, hẹn giờ công khai vào khung giờ vàng. Mô tả rút gọn từ `caption.txt`. Nhãn
"nội dung AI" được gửi kèm (`is_ai_generated`).

Luồng upload port từ dự án Hùng Đông Y (`scripts/dang_bai.py`).

## 1. Lấy token (làm một lần, người dùng tự làm)

**Không dán token vào khung chat.**

1. developers.facebook.com → **My Apps → Create App**, loại **Business**.
2. Thêm sản phẩm **Facebook Login for Business**.
3. **Graph API Explorer** → chọn app → **Get User Access Token**, tick:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`. Chọn Page cần đăng.
4. **Access Token Debugger** → dán token → **Extend Access Token**.
5. Lấy ID Page (Page → Giới thiệu → Minh bạch Trang, hoặc `GET /me/accounts`).
   ID này khác số trong link `profile.php`.
6. Lưu vào `.env` (chạy trong terminal, không qua chat):

```bash
node scripts/update-config.mjs --key FB_PAGE_ID --value "<ID_PAGE>"
```

```bash
node scripts/update-config.mjs --key FB_PAGE_TOKEN --value "<TOKEN_DAI_HAN>"
```

Dùng token người dùng dài hạn hoặc token Page đều được: script tự đổi sang token
của Page `FB_PAGE_ID` mỗi lần chạy (chỉ giữ trong bộ nhớ).

## 2. Đăng

```bash
node scripts/facebook-reel-upload.mjs "<slug>"
node scripts/facebook-reel-upload.mjs --latest
node scripts/facebook-reel-upload.mjs --all
```

- Mặc định **hẹn giờ** vào khung giờ vàng (11:30–13:00, 18:00–19:30,
  21:00–22:30 giờ VN), mỗi Reel cách nhau ≥ 120 phút (≈3 Reel/ngày) để tránh bị coi
  là spam. `--now` đăng ngay. Đổi bằng `FB_PUBLISH_SLOTS` (`off` = đăng ngay) và
  `FB_PUBLISH_GAP_MINUTES`.
- Bỏ qua video render quá 24 giờ (tin cũ), đổi bằng `FB_MAX_AGE_HOURS`.
- Mô tả Reel rút gọn từ `caption.txt`: bỏ câu mẫu chung, giữ một câu hỏi, chỉ
  `#VnNews213` + 3 hashtag chủ đề. `caption.txt` (dùng cho YouTube) giữ nguyên.
- `--force`: đăng lại kể cả khi đã có `videos/<slug>/facebook.json`, và đăng cả video cũ.
- Đăng xong ghi `videos/<slug>/facebook.json` (`videoId`, `url`, `pageId`,
  `uploadedAt`, `publishAt` nếu hẹn giờ); chạy lại sẽ bỏ qua.
- Lỗi in ra đã che token.

## 3. Tự đăng sau render

```bash
node scripts/update-config.mjs --key FACEBOOK_AUTO_UPLOAD --value true
```

Khi bật, `/gen-video` đăng Reel ngay sau bước Render (cũng áp dụng cho `/tao-tin`).
