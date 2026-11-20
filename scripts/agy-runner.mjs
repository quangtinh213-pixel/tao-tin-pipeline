import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {parsePicksJson, parsePubDate, validatePicks} from './rank-news.mjs';

/**
 * Resolve the `agy` CLI executable path.
 */
export function resolveAgyCommand({env = process.env, exists = fs.existsSync, platform = process.platform} = {}) {
  if (env.AGY_BIN) return env.AGY_BIN;
  if (platform === 'win32') {
    const localAppData = env.LOCALAPPDATA || (env.USERPROFILE ? path.join(env.USERPROFILE, 'AppData', 'Local') : null);
    if (localAppData) {
      const candidate = path.join(localAppData, 'agy', 'bin', 'agy.exe');
      if (exists(candidate)) return candidate;
    }
    return 'agy.exe';
  }
  return 'agy';
}

/**
 * Execute `agy` in non-interactive print mode (`-p`).
 */
export function runAgyPrompt(prompt, {
  cwd = process.cwd(),
  model = process.env.AGY_MODEL || undefined,
  timeoutMs = 30 * 60_000,
  disableSlashCommands = false,
  skipPermissions = true,
  mode = 'auto',
  outputFormat = 'text',
  onLog = () => {},
  spawnFn = spawn,
  agyBin = resolveAgyCommand(),
} = {}) {
  return new Promise((resolve, reject) => {
    const args = ['-p', String(prompt), '--output-format', outputFormat];
    if (skipPermissions) args.push('--dangerously-skip-permissions');
    if (mode) args.push('--mode', mode);
    if (disableSlashCommands) args.push('--disable-slash-commands');
    if (model) args.push('--model', model);

    const child = spawnFn(agyBin, args, {
      cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          try {
            child.kill();
          } catch {
            // ignore kill error
          }
        }, timeoutMs)
      : null;

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      stdout += text;
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) onLog(`   [agy] ${line}`);
      }
    });

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString('utf8');
      stderr += text;
    });

    child.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new Error(`Không chạy được agy (${agyBin}): ${err.message}`));
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`agy quá thời gian (${Math.round(timeoutMs / 1000)}s).`));
        return;
      }
      if (code !== 0) {
        const detail = (stderr || stdout).trim().slice(0, 400);
        reject(new Error(`agy thoát với mã ${code}${detail ? `: ${detail}` : ''}`));
        return;
      }
      resolve({stdout, stderr, exitCode: code});
    });
  });
}

/**
 * Verify `agy` CLI is installed and responsive (no LLM API call).
 */
export function checkAgyPreflight({
  agyBin = resolveAgyCommand(),
  timeoutMs = 15_000,
  onLog = console.log,
  spawnFn = spawn,
} = {}) {
  return new Promise((resolve) => {
    const child = spawnFn(agyBin, ['--version'], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      onLog(`🔌 Preflight agy CLI quá thời gian (${timeoutMs}ms).`);
      resolve(false);
    }, timeoutMs);

    child.stdout?.on('data', (c) => { stdout += c.toString('utf8'); });
    child.stderr?.on('data', (c) => { stderr += c.toString('utf8'); });

    child.on('error', (err) => {
      clearTimeout(timer);
      onLog(`🔌 Không tìm thấy agy CLI (${agyBin}): ${err.message}`);
      resolve(false);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        onLog(`✅ agy CLI sẵn sàng (v${stdout.trim() || 'unknown'})`);
        resolve(true);
      } else {
        onLog(`🔌 Preflight agy CLI lỗi (mã ${code}): ${(stderr || stdout).trim()}`);
        resolve(false);
      }
    });
  });
}

/**
 * Rank RSS candidates using `agy` CLI instead of external LLM APIs.
 */
export async function rankArticlesWithAgy(candidates, {
  count,
  recentTitles = [],
  now = new Date(),
  rootDir = process.cwd(),
  model = process.env.AGY_MODEL || undefined,
  timeoutMs = 120_000,
  onLog = () => {},
  runner = runAgyPrompt,
} = {}) {
  if (!candidates.length) return [];
  const compact = candidates.map((item, index) => ({
    index,
    source: item.source,
    title: item.title,
    description: String(item.description ?? '').slice(0, 200),
    ageHours: Math.round(((now.getTime() - parsePubDate(item.pubDate)) / 3_600_000) * 10) / 10,
    hasImage: Boolean(item.thumbnail),
  }));

  const prompt = `Bạn là biên tập viên kênh tin tức video ngắn VNNews.
Chọn đúng ${count} bài phù hợp nhất để làm video từ danh sách ứng viên dưới đây.

Tiêu chí:
- Ưu tiên cao nhất tin HOT, đời sống dân sinh, cứu hộ, pháp luật, thiên tai, sự cố bất ngờ.
- Không chọn tin chỉ báo cáo số liệu khô khan (doanh thu, lãi lỗ, chỉ số vĩ mô, hội nghị).
- Không chọn 2 bài cùng một sự kiện, không trùng sự kiện với video đã đăng 24h qua.
- Ưu tiên tin mới, hasImage = true.

Video đã đăng 24 giờ qua:
${JSON.stringify(recentTitles)}

Ứng viên:
${JSON.stringify(compact)}

Chỉ trả về JSON hợp lệ, không giải thích thêm:
{"picks":[{"index":<số>,"reason":"<lý do, tối đa 20 từ>"}]}`;

  try {
    const {stdout} = await runner(prompt, {
      cwd: rootDir,
      model,
      timeoutMs,
      disableSlashCommands: true,
      skipPermissions: false,
      mode: 'plan',
      outputFormat: 'text',
      onLog: () => {},
    });
    const picks = parsePicksJson(stdout);
    return validatePicks(picks, candidates, {count});
  } catch (err) {
    onLog(`⚠️ Xếp hạng bằng agy thất bại: ${err.message}. Dùng chọn luân phiên.`);
    return [];
  }
}

/**
 * Run `/tao-tin` workflow via `agy` CLI (no external LLM API).
 */
export async function runAgyTaoTin({
  count = 5,
  until = null,
  force = false,
  rootDir = process.cwd(),
  model = process.env.AGY_MODEL || undefined,
  timeoutMs = 45 * 60_000,
  onLog = console.log,
  runner = runAgyPrompt,
} = {}) {
  const slotInstruction = until
    ? `- Nếu chạy theo lịch, kiểm tra \`node scripts/tao-tin.mjs free-slots --until ${until}\` (tối đa ${count} bài). Nếu số slot trống = 0 thì dừng và báo không có slot trống.`
    : `- Chọn tối đa ${count} bài phù hợp nhất.`;

  const prompt = `Thực hiện quy trình tạo tin tự động bằng chính agy (KHÔNG gọi LLM API ngoài như Gemini/OpenAI API để viết kịch bản hay chọn bài).

Hãy đọc kỹ và làm đúng từng bước trong:
1. \`docs/SKILL-TAO-TIN.md\`
2. \`docs/SKILL-GEN-VIDEO.md\`

Yêu cầu cụ thể cho lượt này:
- Bước 0: Chạy \`node scripts/tao-tin.mjs next\`. ${force ? 'Nếu có lượt cũ chưa xong và cần bỏ, chỉ dùng `--force` nếu được yêu cầu.' : 'Nếu còn bài dở thì làm tiếp từ Bước 3 trước.'}
- Bước 1 & 2: Chạy \`node scripts/tao-tin.mjs candidates\`, tự phân tích và chọn bài theo đúng tiêu chí 70/30 trong \`docs/SKILL-TAO-TIN.md\`.
  ${slotInstruction}
  Chạy \`node scripts/tao-tin.mjs select '<json>'${force ? ' --force' : ''}\`.
- Bước 3: Lặp tuần tự từng bài (KHÔNG chạy song song):
  1) \`node scripts/tao-tin.mjs next\` (lấy \`link\` và \`templateId\` được phân bổ cho bài đó, mặc định \`news/media-showcase\` nếu không có)
  2) Thực hiện đầy đủ pipeline \`/gen-video --template <templateId> --audio=full <link>\`
  3) Render xong -> chạy \`node scripts/youtube-upload.mjs "<slug>"\`
  4) Ghi kết quả bằng \`node scripts/tao-tin.mjs record ...\`
- Bước 4: Chạy \`node scripts/tao-tin.mjs finish\` để tổng kết và gửi Telegram.

Không hỏi lại người dùng giữa chừng trừ khi gặp blocker thật sự.`;

  onLog(`🤖 Đang gọi agy CLI để chạy /tao-tin (${count} bài)...`);
  return runner(prompt, {
    cwd: rootDir,
    model,
    timeoutMs,
    disableSlashCommands: false,
    skipPermissions: true,
    mode: 'auto',
    outputFormat: 'text',
    onLog,
  });
}

/**
 * Run `/tao-video-dai` workflow via `agy` CLI (no external LLM API).
 */
export async function runAgyTaoVideoDai({
  count = 1,
  rootDir = process.cwd(),
  model = process.env.AGY_MODEL || undefined,
  timeoutMs = 45 * 60_000,
  onLog = console.log,
  runner = runAgyPrompt,
} = {}) {
  const prompt = `Thực hiện quy trình tạo video dài 16:9 bằng pipeline HyperFrames thu gọn theo hướng dẫn trong \`docs/SKILL-TAO-VIDEO-DAI.md\`.

Yêu cầu cụ thể cho lượt này:
- Bước 1: Chạy \`node scripts/long-news-filter.mjs --count ${count}\` để lấy tin nóng nhất vào \`data/long-queue.json\`.
- Bước 2: Với tối đa ${count} tin đạt chuẩn (tuần tự):
  Chạy lệnh tạo video dài: \`node scripts/tao-video-dai.mjs\` (tự động chạy từ kiểm duyệt kịch bản, giọng đọc, chia cảnh, render HyperFrames 1080p, tạo thumbnail, và hẹn giờ YouTube).
  Gửi thông báo Telegram kết quả sau khi hoàn tất.

Không hỏi lại người dùng giữa chừng trừ khi gặp blocker thật sự.`;

  onLog(`🤖 Đang gọi agy CLI để chạy /tao-video-dai (${count} video)...`);
  return runner(prompt, {
    cwd: rootDir,
    model,
    timeoutMs,
    disableSlashCommands: false,
    skipPermissions: true,
    mode: 'auto',
    outputFormat: 'text',
    onLog,
  });
}

/**
 * Run `/gen-video` for a single job via `agy` CLI (no external LLM API).
 */
export async function runAgyGenVideo({
  context,
  templateId = 'news/media-showcase',
  audioMode = 'full',
  slug = null,
  rootDir = process.cwd(),
  model = process.env.AGY_MODEL || undefined,
  timeoutMs = 25 * 60_000,
  onLog = console.log,
  runner = runAgyPrompt,
} = {}) {
  const slugNote = slug ? `\n- Nếu có thể hãy dùng slug \`${slug}\` (thư mục \`videos/${slug}\`).` : '';
  const prompt = `Thực hiện pipeline \`/gen-video --template ${templateId} --audio=${audioMode}\` bằng chính agy (KHÔNG gọi LLM API ngoài như Gemini/OpenAI API).

Hãy đọc \`docs/SKILL-GEN-VIDEO.md\` và tài liệu template tương ứng trong \`docs/templates/\`, rồi thực hiện đầy đủ các bước cho context sau:
\`\`\`
${context}
\`\`\`${slugNote}
Đảm bảo file \`output/video.mp4\` được render thành công và kiểm tra lỗi trước khi kết thúc.`;

  onLog(`🤖 Đang gọi agy CLI để dựng video (${templateId})...`);
  return runner(prompt, {
    cwd: rootDir,
    model,
    timeoutMs,
    disableSlashCommands: false,
    skipPermissions: true,
    mode: 'auto',
    outputFormat: 'text',
    onLog,
  });
}
