#!/usr/bin/env bash
# Dọn ổ đĩa VPS: xoá file nặng của các video ĐÃ đăng YouTube xong.
#   - videos/<slug>/output/   (video.mp4)
#   - public/<slug>/          (ảnh, audio dùng để render)
# Giữ lại các file nhỏ (youtube.json, caption, script...) vì youtube.json
# được dùng để xếp khung giờ đăng. Video chưa có youtube.json (upload lỗi,
# hết quota) được giữ nguyên để lượt sau đăng lại.
# Dùng: cleanup-uploaded.sh [--dry-run]
set -uo pipefail

APP_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DRY=""
[ "${1:-}" = "--dry-run" ] && DRY=1

freed=0
count=0
for yt in "$APP_DIR"/videos/*/youtube.json; do
  [ -f "$yt" ] || continue
  grep -q '"videoId"[[:space:]]*:[[:space:]]*"[^"]' "$yt" || continue
  slug_dir="$(dirname "$yt")"
  slug="$(basename "$slug_dir")"
  targets=()
  [ -d "$slug_dir/output" ] && targets+=("$slug_dir/output")
  [ -d "$APP_DIR/public/$slug" ] && targets+=("$APP_DIR/public/$slug")
  [ ${#targets[@]} -eq 0 ] && continue
  kb=$(du -sk "${targets[@]}" | awk '{s+=$1} END{print s}')
  freed=$((freed + kb))
  count=$((count + 1))
  if [ -n "$DRY" ]; then
    echo "[dry-run] sẽ xoá $slug ($((kb / 1024)) MB)"
  else
    rm -rf "${targets[@]}"
    echo "đã xoá $slug ($((kb / 1024)) MB)"
  fi
done
echo "=== dọn $count video, giải phóng $((freed / 1024)) MB${DRY:+ (dry-run, chưa xoá gì)}"
