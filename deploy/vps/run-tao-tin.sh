#!/usr/bin/env bash
# Chạy một việc bằng agy (mặc định: một lượt "tạo tin"). Dùng cho cron và bot Zalo.
# Có khoá chung: chỉ một việc chạy tại một thời điểm.
# Dùng: run-tao-tin.sh [số_bài]
#   AGY_PROMPT=...  thay prompt mặc định (bot dùng cho link bài báo, câu hỏi...)
#   LOG_FILE=...    đường dẫn log
# Mã thoát 75 = đang có việc khác chạy, đã bỏ qua.
set -uo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COUNT="${1:-}"
mkdir -p "$APP_DIR/logs"
LOG="${LOG_FILE:-$APP_DIR/logs/tao-tin-$(date +%Y%m%d-%H%M).log}"
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$APP_DIR"

exec 9>"$APP_DIR/data/vps-tao-tin.lock"
if ! flock -n 9; then
  echo "$(date) đang có việc khác chạy, bỏ qua" >> "$APP_DIR/logs/skipped.log"
  exit 75
fi

git pull --ff-only >>"$LOG" 2>&1 || true

DEFAULT_PROMPT="Đọc AGENTS.md và docs/SKILL-TAO-TIN.md rồi chạy /tao-tin ${COUNT} đến hết."
PROMPT="${AGY_PROMPT:-$DEFAULT_PROMPT} Đây là lượt chạy tự động trên VPS, không có người trả lời: không hỏi lại, tự xử lý lỗi theo tài liệu. Lệnh bị từ chối quyền thì bỏ qua và ghi vào báo cáo."

# Không có ai bấm duyệt: chỉ cho phép đúng các lệnh pipeline cần
# (danh sách ở agy-settings.json); lệnh ngoài danh sách bị từ chối.
timeout 4h agy -p "$PROMPT" \
  --settings "$APP_DIR/deploy/vps/agy-settings.json" \
  --output-format text \
  --print-timeout 0 >>"$LOG" 2>&1
CODE=$?

if [ $CODE -ne 0 ] && [ -z "${AGY_PROMPT:-}" ]; then
  node scripts/notify-telegram.mjs "⚠️ VPS tạo tin lỗi (exit $CODE). Log: $LOG" >/dev/null 2>&1 || true
fi

find "$APP_DIR/logs" -name '*.log' -mtime +14 -delete 2>/dev/null
exit $CODE
