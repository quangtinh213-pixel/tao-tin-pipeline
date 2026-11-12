# Chạy /tao-tin tự động trên VPS bằng agy

VPS: Ubuntu 22.04/24.04, tối thiểu 4 vCPU, 8 GB RAM, 40 GB SSD. Render Remotion ăn CPU nhiều nhất.

## 1. Đăng nhập bằng SSH key, bỏ mật khẩu (làm trên Mac)

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<IP_VPS>
```

Lệnh này hỏi mật khẩu root một lần. Sau đó `ssh root@<IP_VPS>` vào thẳng, không cần mật khẩu nữa. Nhớ đổi mật khẩu root bằng `passwd`.

## 2. Cài môi trường (trên VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/quangtinh213-pixel/tao-tin-pipeline/main/deploy/vps/setup-vps.sh | bash
```

Script cài: Node 22, ffmpeg, font tiếng Việt, Chromium cho Playwright/Remotion, edge-tts, swap 4 GB. Mã nguồn được clone vào `/opt/tao-tin`.

## 3. Copy `.env` từ Mac lên (làm trên Mac)

```bash
scp .env root@<IP_VPS>:/opt/tao-tin/.env
```

`.env` đã chứa YouTube refresh token, nên trên VPS không cần chạy lại `youtube:auth`.

## 4. Cài agy và đăng nhập (trên VPS, làm 1 lần)

Cài bản Linux của Antigravity CLI theo hướng dẫn chính thức của Google. Sau đó chạy `agy` một lần để đăng nhập tài khoản Google. Kiểm tra lại:

```bash
agy -p "trả lời OK" --output-format json
```

## 5. Chạy thử 1 bài

```bash
/opt/tao-tin/deploy/vps/run-tao-tin.sh 1
```

Log được ghi vào `/opt/tao-tin/logs/tao-tin-*.log`. Theo dõi trực tiếp bằng `tail -f /opt/tao-tin/logs/tao-tin-*.log`.

## 6. Bật lịch tự động

Chạy `crontab -e` rồi thêm dòng sau. VPS để giờ VN (`timedatectl set-timezone Asia/Ho_Chi_Minh`):

```
0 6,11,16,21 * * * /opt/tao-tin/deploy/vps/run-tao-tin.sh >/dev/null 2>&1
```

- Mỗi lượt có khoá. Lượt cũ chưa xong thì lượt mới tự bỏ qua, các bài không bao giờ chạy song song.
- Mỗi lượt tối đa 4 giờ. Nếu lỗi, VPS báo qua Telegram (cần `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` trong `.env`).
- agy chạy với `--dangerously-skip-permissions` vì khi chạy cron không có ai bấm duyệt lệnh. Vì vậy chỉ chạy trên VPS dành riêng cho việc này.

## Lưu ý

- **Đừng chạy `tạo tin` trên Mac và VPS cùng lúc.** Hai máy giữ `data/processed-news.json` riêng nên có thể làm trùng bài. Khi chuyển sang VPS thì tắt lịch trên Mac.
- Muốn cập nhật code: push lên GitHub. Mỗi lượt chạy tự `git pull`.
