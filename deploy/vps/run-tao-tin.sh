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
# Model Google hay báo 503 "No capacity" lúc đông: chờ rồi thử lại, sau đó đổi model.
# Lượt dở được /tao-tin tự làm tiếp (Bước 0), nên chạy lại từ đầu là an toàn.
MODELS=("" "" "gemini-3.8-flash-medium" "claude-sonnet-4-6")
CODE=1
for i in "${!MODELS[@]}"; do
  MODEL="${MODELS[$i]}"
  ATTEMPT_LOG="$(mktemp)"
  echo "=== lần $((i+1)) $(date +%H:%M:%S) model=${MODEL:-mặc định}" >>"$LOG"
  timeout 4h agy -p "$PROMPT" \
    ${MODEL:+--model "$MODEL"} \
    --settings "$APP_DIR/deploy/vps/agy-settings.json" \
    --output-format text \
    --print-timeout 0 >"$ATTEMPT_LOG" 2>&1
  CODE=$?
  cat "$ATTEMPT_LOG" >>"$LOG"
  if grep -qE 'code 503|UNAVAILABLE|RESOURCE_EXHAUSTED|No capacity|high traffic' "$ATTEMPT_LOG"; then
    rm -f "$ATTEMPT_LOG"
    echo "=== model quá tải, chờ 2 phút rồi thử lại" >>"$LOG"
    sleep 120
    continue
  fi
  rm -f "$ATTEMPT_LOG"
  break
done
echo "=== kết thúc $(date +%H:%M:%S) exit=$CODE" >>"$LOG"

if [ $CODE -ne 0 ] && [ -z "${AGY_PROMPT:-}" ]; then
  node scripts/notify-telegram.mjs "⚠️ VPS tạo tin lỗi (exit $CODE). Log: $LOG" >/dev/null 2>&1 || true
fi

# Xoá video + tài nguyên render của các bài đã đăng YouTube xong (giữ ổ 40 GB không đầy).
"$APP_DIR/deploy/vps/cleanup-uploaded.sh" >>"$LOG" 2>&1 || true

find "$APP_DIR/logs" -name '*.log' -mtime +14 -delete 2>/dev/null
exit $CODE
