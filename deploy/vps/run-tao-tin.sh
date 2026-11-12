#!/usr/bin/env bash
# Một lượt "tạo tin" bằng agy, chạy từ cron. Có khoá chống chạy chồng.
# Dùng: run-tao-tin.sh [số_bài]
set -uo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COUNT="${1:-}"
LOG="$APP_DIR/logs/tao-tin-$(date +%Y%m%d-%H%M).log"
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd "$APP_DIR"

# Lượt trước chưa xong thì bỏ lượt này (các bài ghi chung src/, không chạy song song).
exec 9>"$APP_DIR/data/vps-tao-tin.lock"
if ! flock -n 9; then
  echo "$(date) lượt trước còn chạy, bỏ qua" >> "$APP_DIR/logs/skipped.log"
  exit 0
fi

git pull --ff-only >>"$LOG" 2>&1 || true

PROMPT="Đọc AGENTS.md và docs/SKILL-TAO-TIN.md rồi chạy /tao-tin ${COUNT} đến hết, đây là lượt chạy theo lịch tự động, không có người trả lời: không hỏi lại, tự xử lý lỗi theo tài liệu."

# --dangerously-skip-permissions: bắt buộc vì không có ai bấm duyệt lệnh khi chạy cron.
timeout 4h agy -p "$PROMPT" \
  --dangerously-skip-permissions \
  --output-format text \
  --print-timeout 0 >>"$LOG" 2>&1
CODE=$?

if [ $CODE -ne 0 ]; then
  node scripts/notify-telegram.mjs "⚠️ VPS tạo tin lỗi (exit $CODE). Log: $LOG" >/dev/null 2>&1 || true
fi

# Dọn log cũ hơn 14 ngày
find "$APP_DIR/logs" -name 'tao-tin-*.log' -mtime +14 -delete 2>/dev/null
exit $CODE
