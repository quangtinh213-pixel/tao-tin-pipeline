/**
 * scripts/clean-public-cache.mjs
 *
 * Dọn dẹp thư mục public/ để giảm kích thước copy trước mỗi lần render.
 *
 * Hành vi:
 *   - Xoá các file ảnh preview test ở gốc public/ (test-preview-*, v2-preview-*, v3-preview-*)
 *   - Liệt kê các thư mục slug cũ trong public/ (trừ assets/, test-run)
 *   - Với cờ --keep-active: giữ lại slug đang active trong src/Root.tsx
 *   - Với cờ --dry-run: chỉ in danh sách file sẽ xoá, không thực sự xoá
 *   - Với cờ --all: xoá tất cả slug cũ (trừ slug đang active)
 *
 * Usage:
 *   node scripts/clean-public-cache.mjs                  # Liệt kê file rác
 *   node scripts/clean-public-cache.mjs --dry-run        # Xem trước sẽ xoá gì
 *   node scripts/clean-public-cache.mjs --all            # Xoá tất cả slug cũ + file rác
 *   node scripts/clean-public-cache.mjs --all --dry-run  # Xem trước xoá tất cả
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const removeAll = flags.includes('--all');

// ── Protected entries that must never be removed ──────────────────────────────
const PROTECTED = new Set(['assets', 'watermark.png', '.DS_Store']);

// ── Detect the active slug from src/Root.tsx ──────────────────────────────────
function getActiveSlug() {
  const rootTsx = path.join(ROOT, 'src', 'Root.tsx');
  if (!fs.existsSync(rootTsx)) return null;
  const content = fs.readFileSync(rootTsx, 'utf-8');
  const match = content.match(/defaultSlug\s*=\s*['"`]([^'"`]+)['"`]/);
  return match ? match[1] : null;
}

// ── Collect removable items ───────────────────────────────────────────────────
function collectRemovable(activeSlug) {
  const entries = fs.readdirSync(PUBLIC);
  const removable = [];

  for (const entry of entries) {
    // Never touch protected entries
    if (PROTECTED.has(entry)) continue;

    const fullPath = path.join(PUBLIC, entry);
    const stat = fs.statSync(fullPath);

    // Always remove stale preview images at public/ root
    if (stat.isFile() && /^(test-preview-|v2-preview-|v3-preview-)/.test(entry)) {
      removable.push({ path: fullPath, name: entry, type: 'preview-image' });
      continue;
    }

    // Slug directories
    if (stat.isDirectory()) {
      // Skip the actively-used slug
      if (activeSlug && entry === activeSlug) continue;

      // Skip test-run directory
      if (entry === 'test-run') continue;

      if (removeAll) {
        removable.push({ path: fullPath, name: entry, type: 'slug-dir' });
      }
    }
  }

  return removable;
}

// ── Size helpers ──────────────────────────────────────────────────────────────
function dirSize(dirPath) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        size += fs.statSync(full).size;
      } else if (entry.isDirectory()) {
        size += dirSize(full);
      }
    }
  } catch { /* ignore permission errors */ }
  return size;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function rmRecursive(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

// ── Main ──────────────────────────────────────────────────────────────────────
const activeSlug = getActiveSlug();
const removable = collectRemovable(activeSlug);

// Show current public/ size
const totalPublicSize = dirSize(PUBLIC);
console.log(`📁 Thư mục public/ hiện tại: ${formatSize(totalPublicSize)}`);
if (activeSlug) {
  console.log(`🎬 Slug đang hoạt động: ${activeSlug} (được bảo vệ)`);
}
console.log('');

if (removable.length === 0) {
  if (!removeAll) {
    // List slug dirs that could be cleaned with --all
    const entries = fs.readdirSync(PUBLIC);
    const slugDirs = entries.filter((e) => {
      if (PROTECTED.has(e) || e === 'test-run') return false;
      if (activeSlug && e === activeSlug) return false;
      const stat = fs.statSync(path.join(PUBLIC, e));
      return stat.isDirectory();
    });
    if (slugDirs.length > 0) {
      console.log(`📋 ${slugDirs.length} thư mục slug cũ có thể dọn dẹp với --all:`);
      for (const d of slugDirs) {
        const size = dirSize(path.join(PUBLIC, d));
        console.log(`   📂 ${d}  (${formatSize(size)})`);
      }
      console.log('');
      console.log('💡 Chạy: node scripts/clean-public-cache.mjs --all --dry-run');
    } else {
      console.log('✅ Không có file rác hoặc slug cũ cần dọn dẹp.');
    }
  } else {
    console.log('✅ Không có file nào cần xoá.');
  }
  process.exit(0);
}

// Calculate total savings
let totalSavings = 0;
console.log(`${dryRun ? '🔍 [DRY RUN]' : '🗑️'} Sẽ xoá ${removable.length} mục:`);
console.log('');

for (const item of removable) {
  const stat = fs.statSync(item.path);
  const size = stat.isDirectory() ? dirSize(item.path) : stat.size;
  totalSavings += size;

  const icon = item.type === 'preview-image' ? '🖼️' : '📂';
  console.log(`  ${icon} ${item.name}  (${formatSize(size)})`);
}

console.log('');
console.log(`💾 Tổng dung lượng giải phóng: ${formatSize(totalSavings)}`);
console.log(`📉 public/ sau dọn: ~${formatSize(totalPublicSize - totalSavings)}`);
console.log('');

if (dryRun) {
  console.log('ℹ️  Chế độ dry-run — không xoá file nào.');
  console.log('   Bỏ --dry-run để thực hiện xoá.');
  process.exit(0);
}

// Actually remove
for (const item of removable) {
  rmRecursive(item.path);
  console.log(`  ✅ Đã xoá: ${item.name}`);
}

console.log('');
console.log(`🎉 Dọn dẹp xong! Đã giải phóng ${formatSize(totalSavings)}.`);
