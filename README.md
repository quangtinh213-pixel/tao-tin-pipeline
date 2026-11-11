# Create Video with AI

Tạo video ngắn bằng Remotion + AI Agent với voiceover tự động.

Pipeline đầy đủ: lên kế hoạch → viết script → TTS (giọng nói) → STT (timestamps) → thiết kế spec → tự sinh caption → render Remotion.

## Quick Start

```bash
/setup
```

Cài đặt tất cả dependencies và cấu hình môi trường tự động.

```bash
/gen-video <context>
/gen-video --template news/current-affairs-dark --audio=voice-only <context>
```

Khi gửi riêng một link bài viết công khai, hoặc link kèm yêu cầu tạo video,
workflow mặc định tương đương:

```bash
/gen-video --template news/media-showcase --audio=full <article-url>
```

Các cờ `--template`/`--audio` được ghi rõ bởi người dùng luôn được ưu tiên.
Link được gửi để hỏi, tóm tắt, dịch hoặc phân tích mà không yêu cầu tạo video
không kích hoạt shortcut này.

Without `--template`, generation uses `creative/free-style`: AI creates
content-driven scenes while preserving the shared watermark, subtitle, timing,
and verification contracts.

`--audio` accepts `full`, `music`, `sfx`, or `voice-only`. Omit it to preserve
the selected template's default audio behavior.

Tạo video từ nội dung context được cung cấp.

## Video Production Studio

Thêm các biến sau vào `.env` để bật agent sản xuất ở phía server:

```dotenv
OPENAI_API_KEY=your_project_api_key
OPENAI_MODEL=gpt-6-astra
```

TTS và STT vẫn dùng các khóa provider đã mô tả trong `.env.example`. Sau đó mở
WebUI local:

```bash
npm run dashboard
```

WebUI cho phép nhập URL bài viết hoặc context, chọn template/audio, đưa video
vào hàng đợi, theo dõi từng bước và huỷ một tác vụ đang chạy. URL bài viết tự
áp dụng `news/media-showcase` + `audio=full`. Agent đọc tài liệu workflow chuẩn,
chỉ dùng các thao tác đã giới hạn, rồi chạy acquisition → Planner → Teller →
TTS → STT → Spec → Caption → Coder → Render → Verify. Các job chạy tuần tự vì
pipeline dùng chung thư mục `src/`.

Kho video cũ vẫn được giữ nguyên: tìm video, mở đúng `video.mp4` trong Finder,
sao chép kịch bản và caption. WebUI không phát, tải xuống hay đăng video lên mạng
xã hội. `OPENAI_API_KEY` chỉ được đọc ở Node server, không gửi xuống trình duyệt.

Mỗi lần `/gen-video` hoàn thành Spec, workflow chạy
`node scripts/generate-caption.mjs "<slug>"` và lưu
`videos/<slug>/caption.txt`. Trong dashboard, nút **Sao chép caption** chỉ đưa
nội dung vào clipboard để bạn tự đăng lên nền tảng mong muốn.

## Bundled Templates

Bản này đi kèm một bộ template free để dùng ngay:

- Creative: `free-style`, `free-style-sfx`, `pixel-style`, `pixel-style-sfx`,
  `demo-scroll`, `demo-scroll-sfx`, `article-video-demo`, `source-led-light`,
  `source-led-dark`, `source-led-light-sfx`, `source-led-dark-sfx`
- News: `tech-dark`, `tech-light`, `current-affairs-light`,
  `current-affairs-dark`, `real-estate-civic-light`,
  `real-estate-civic-dark`, `entertainment-magazine-light`,
  `entertainment-premiere-dark`, `sports-arena-dark`,
  `sports-briefing-light`, `health-briefing-light`, `health-public-alert`,
  `business-terminal-dark`, `business-ledger-light`,
  `travel-postcard-light`, `travel-guide-light`, `auto-showroom-dark`,
  `media-showcase`,
  `auto-market-light`, `education-briefing-light`, `education-campus-light`

Để thêm template mới sau này, đặt package đã mua hoặc được tặng vào
`load-templates/`, rồi chạy `/sync-templates`.

## Supported Agents

| Agent | Cấu hình |
|-------|----------|
| Kiro | `.kiro/skills/video-gen/SKILL.md` |
| Cursor | `.cursor/rules/gen-video.mdc` |
| Claude Code | `.claude/commands/gen-video.md` |
| Gemini / Codex | `docs/SKILL-GEN-VIDEO.md` |

## Cấu hình (.env)

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|----------|---------|-------|
| `ASPECT_RATIO` | Không | `9:16` | Tỷ lệ khung hình (`9:16` dọc hoặc `16:9` ngang) |
| `THEME` | Không | `dark` | Giao diện (`dark` hoặc `light`) |
| `SHOW_SUBTITLES` | Không | `true` | Hiển thị subtitle tô sáng theo timeline |
| `ELEVENLABS_API_KEY` | Không* | — | API key ElevenLabs (TTS chính) |
| `ELEVENLABS_VOICE_ID` | Không | `K7ewtjKRNtwwt3lKQ6M0` | Voice ID ElevenLabs |
| `GEMINI_API_KEY` | Không* | — | API key Gemini (TTS dự phòng) |
| `GEMINI_TTS_VOICE` | Không | `Achird` | Tên voice Gemini TTS |
| `GROQ_API_KEY` | Không* | — | API key Groq STT chính |
| `GROQ_STT_MODEL` | Không | `whisper-large-v3-turbo` | Model Groq STT |
| `STT_API_KEY` | Không* | — | Bearer token api.stt.ai dự phòng |
| `STT_LANGUAGE` | Không | `vi` | Ngôn ngữ STT |

*Cần ít nhất một TTS key. Ưu tiên: ElevenLabs → Gemini.
*Cần ít nhất một STT key. Ưu tiên: Groq → api.stt.ai.

## Yêu cầu hệ thống

- Node.js 20.x, 22.x hoặc 24.x
- Chromium do Playwright cài đặt
- ffmpeg trên `PATH`
- Hỗ trợ chính thức: macOS 14+, Windows 11+/Server 2019+, Ubuntu 22.04/24.04,
  Debian 12/13. Các bản phân phối Linux khác là best effort.

Xem hướng dẫn đa nền tảng đầy đủ tại
[`docs/SKILL-SETUP.md`](docs/SKILL-SETUP.md).

## Pipeline

```
/gen-video [--audio=<mode>] <context>
  → Step 1: Setup       (slug, thư mục, context.txt, audio.txt)
  → Step 2: Planner     (plan.json — tiếng Việt)
  → Step 3: Teller      (script.json — tiếng Việt)
  → Step 4: Audio       (voice.mp3 — ElevenLabs / Gemini)
  → Step 5: Transcribe  (timeline.json — Groq hoặc api.stt.ai)
  → Step 6: Spec        (spec.json — scene timing từ timeline.json)
  → Caption            (caption.txt — 100–180 từ, 10–15 hashtag SEO, CTA mở)
  → Step 7: Coder       (template/custom scenes + VideoContent.tsx + Root.tsx)
  → Step 8: Render      (video.mp4)
```

## Cấu trúc thư mục

```
create-video-with-ai/
├── scripts/
│   ├── tts.mjs          ← TTS: ElevenLabs (primary) / Gemini (fallback) / Edge TTS (last)
│   └── transcribe.mjs   ← STT: Groq / api.stt.ai → timeline.json
├── src/
│   ├── Root.tsx          ← Cập nhật defaultSlug + defaultDuration mỗi run
│   ├── Video.tsx         ← Không sửa
│   ├── VideoContent.tsx  ← Tạo lại mỗi run (có <Audio>)
│   ├── tokens.ts         ← Interface DesignTokens (không sửa)
│   └── scenes/           ← Tạo lại mỗi run
│       ├── tokens.ts
│       ├── Scene1Hook.tsx
│       └── ...
├── videos/<slug>/
│   ├── context.txt
│   ├── audio.txt
│   ├── plan.json
│   ├── script/script.json
│   ├── spec.json
│   ├── caption.txt
│   └── output/video.mp4
└── public/<slug>/
    ├── voice.mp3
    └── timeline.json
```
