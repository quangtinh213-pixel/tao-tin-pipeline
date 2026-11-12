#!/usr/bin/env bash
# Cài môi trường chạy /tao-tin trên VPS Ubuntu/Debian (chạy bằng root).
# Dùng: bash setup-vps.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/quangtinh213-pixel/tao-tin-pipeline.git}"
APP_DIR="${APP_DIR:-/opt/tao-tin}"

echo "==> Gói hệ thống"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git ffmpeg python3 python3-pip util-linux ca-certificates \
  fonts-noto fonts-noto-color-emoji fonts-dejavu-core

echo "==> Swap 4GB (render Remotion tốn RAM)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Node.js 22"
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Edge TTS (dự phòng TTS cuối cùng)"
pip3 install --break-system-packages edge-tts 2>/dev/null || pip3 install edge-tts || true

echo "==> Mã nguồn"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi
cd "$APP_DIR"
npm ci
npx playwright install --with-deps chromium
npx remotion browser ensure || true

mkdir -p "$APP_DIR/logs"
chmod +x "$APP_DIR/deploy/vps/run-tao-tin.sh"

cat <<EOF

✅ Cài xong môi trường. Còn 3 việc bạn tự làm (xem deploy/vps/README.md):
  1. Copy file .env từ Mac lên:  scp .env root@<IP>:$APP_DIR/.env
  2. Cài agy cho Linux rồi đăng nhập Google:  agy   (làm 1 lần)
  3. Chạy thử:  $APP_DIR/deploy/vps/run-tao-tin.sh
     rồi bật cron:  crontab -e  (dòng mẫu trong README)
EOF
