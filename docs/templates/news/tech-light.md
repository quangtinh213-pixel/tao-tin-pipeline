# Template Spec Rules: news/tech-light

Read this document before running Step 6 (Spec) when `--template news/tech-light` is specified.

---

## What this template is

Tech news short-form video. Clean editorial design inspired by VnExpress / Bloomberg style.

Key characteristics:
- **Background**: off-white `#F5F4F2` — clean newspaper feel
- **Top accent bar**: 6px red gradient line at very top of frame
- **Typography-driven**: no full-bleed images — large bold headlines dominate
- **Accent words**: key terms in the headline rendered in red `#CC1B1B`
- **Media cards**: images and videos use a rounded card with a mandatory source credit bar
- **Vertical 9:16 media**: remains inside the card, uses `contain`, and has a capped media height to prevent scene overflow
- **Images/videos**: fetched from public URLs (from the article) — never fabricated
- **Fixed subtitles**: word-by-word highlight in red at the bottom, synced to audio
- **AI decides**: scene type, which sentences are headlines vs body, which words get accent color, whether to include an image card per scene

---

## Input handling

### If user provides a URL (article link):
1. Fetch the article content using web tools
2. Extract: title, date, key facts, quotes, images (URLs + source names)
3. Summarize into plan → script following the normal pipeline steps
4. For each image found: record `src` (URL), `credit` (publication name), `date`, `mediaType` if video

**Image/video URL rules — STRICT:**
- ✅ Accept: `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mov`
- ❌ Reject: `.gif`, `.svg`, `.avif`, `.bmp`, any animated format
- If an image URL contains `?` query params, keep it as-is (CDN URLs are valid)
- If unsure about format → omit the image rather than risk a broken render

### If user provides plain text context:
- Follow normal pipeline — no image fetching needed
- Omit `image` field in scenes where no image URL is available

---

## Step 2 (Planner) — News-specific rules

`plan.json` structure is the same as standard pipeline, plus:
- `hook`: one punchy sentence that frames WHY this news matters right now
- `segments`: 3–5 body segments — each covers one key fact, quote, or data point
- `ending`: brief takeaway or "what happens next"
- `estimated_duration`: 45–75 seconds (news videos are tighter than philosophy)

---

## Step 3 (Teller) — News script rules

- `hook` segment: 1–2 sentences max — provocative, factual, present tense
- `body` segments: each segment = 1 key fact — short, punchy, no fluff
- `ending` segment: 1–2 sentences — implication or next development
- All text in Vietnamese, neutral journalistic tone
- **Collect image URLs** from the article during this step — save to a temporary list for Step 6

---

## Step 6 Output

Create `videos/<slug>/spec.json`:

```json
{
  "templateId": "news/tech-light",
  "slug": "<slug>",
  "totalFrames": <number>,
  "video": {
    "title": "<Vietnamese title — max 8 words>",
    "date": "<DD/MM/YYYY>",
    "bgMusic": "assets/news/music/news-ambient-01.mp3"
  },
  "scenes": [...]
}
```

`bgMusic`: always set to `"assets/news/music/news-ambient-01.mp3"` — subtle
neutral background music suitable for news. The Layout renders it with loop
using the track's `volume` from `public/assets/news/manifest.json`. Do NOT set
to `null`.

---

## Scene Timing

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract.

---

## Scene Types

### `hook` — Opening scene

Use for the first script segment (`type: "hook"`).

```json
{
  "type": "hook",
  "startFrame": 0,
  "durationFrames": 210,
  "audioSegment": { "start": 0.0, "end": 7.0, "text": "..." },
  "hook": {
    "tags": ["AI", "OpenAI", "GPT-5"],
    "badge": {
      "type": "breaking",
      "date": "15/5/2026",
      "tags": ["🇺🇸 Hoa Kỳ", "🇨🇳 Trung Quốc"]
    },
    "headline": "Lần đầu tiên trong {lịch sử} Mỹ — {Trung}",
    "lead": "Một tổng thống Mỹ bước vào nơi không phải Nhà Trắng — mà là trung tâm quyền lực của Bắc Kinh."
  }
}
```

**`tags` (optional):** tech topic pills shown above the badge — use short keywords like product names, company names, tech categories. Max 4 tags. Example: `["AI", "Apple", "M5", "Chip"]`

**Headline rules for hook:**
- Max 10 words
- 1–3 key words wrapped in `{}` → rendered in red
- Must be punchy — not a full sentence

**Badge types for hook:** `breaking` (TIN NÓNG) or `event` (SỰ KIỆN)

**Badge `tags`:** use flag emoji + country/city names relevant to the story

---

### `body` — Body scene with optional image and stat

Use for each `body` segment.

```json
{
  "type": "body",
  "startFrame": 210,
  "durationFrames": 270,
  "audioSegment": { "start": 7.0, "end": 16.0, "text": "..." },
  "body": {
    "tags": ["Chip", "Apple", "M5"],
    "badge": { "type": "event" },
    "headline": "Chip {M5} mạnh hơn {40%} so với thế hệ trước",
    "body": "Apple công bố chip M5 với hiệu năng vượt trội — {tốc độ xử lý AI} tăng gấp đôi so với M4.",
    "bodyItalic": false,
    "stat": {
      "icon": "⚡",
      "label": "Hiệu năng AI",
      "value": 40,
      "prefix": "+",
      "suffix": "%",
      "context": "so với chip M4 thế hệ trước"
    },
    "image": {
      "src": "https://example.com/apple-m5.jpg",
      "credit": "Apple",
      "date": "7/6/2026",
      "mediaType": "ẢNH"
    },
    "imageKenBurns": { "direction": "zoom-in", "startScale": 1.0, "endScale": 1.06 }
  }
}
```

**`tags` (optional):** tech topic pills — short keywords. Max 4. Examples: `["AI", "Apple", "M5"]`, `["Startup", "Funding", "Series B"]`

**`stat` (optional) — StatCard fields:**

| Field | Type | Description |
|---|---|---|
| `label` | string | Uppercase label: `"HIỆU NĂNG"`, `"ĐỊNH GIÁ"`, `"NGƯỜI DÙNG"` |
| `icon` | string | Emoji icon before label: `"⚡"`, `"💰"`, `"🚀"`, `"📱"`, `"🧠"` |
| `value` | number | Numeric value to count up to |
| `prefix` | string | Before number: `"+"`, `"-"`, `"~"`, `"$"` |
| `suffix` | string | After number: `"%"`, `" tỷ USD"`, `"M"`, `"x"`, `" tỷ"` |
| `context` | string | Muted line below number: `"so với thế hệ trước"` |
| `displayValue` | string | Override number entirely for non-numeric: `"GPT-5"`, `"#1"` |

**When to use `stat`:**
- Scene mentions a specific number, percentage, price, speed, or ranking
- Data point is the KEY FACT of the scene — not just background context
- One stat per scene maximum — don't stack multiple StatCards

**When NOT to use `stat`:**
- Scene is primarily about an event or quote (no strong number)
- Scene already has an image — prefer image over stat unless both fit vertically

**Image rules:**
- `src`: MUST be a real URL from the article — `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4` only — **NO `.gif`**
- `credit`: publication name (VnExpress, Reuters, AP, Bloomberg…)
- `date`: publication date of the image
- `mediaType`: `"VIDEO"` if it's a video thumbnail, `"ẢNH"` for photos, `"INFOGRAPHIC"` for charts
- `locationLabel`: short geographic label shown top-right (optional)
- Images and videos close to `9:16` remain in the standard card with a capped media height.
- Videos play muted and loop for the scene duration.
- Horizontal, square, and other non-9:16 media keep the existing card behavior.
- If no image is available for a scene → omit the `image` field entirely

**Badge types for body:** `event`, `analysis`, `update`, `exclusive`

**`bodyItalic: true`** — use for quotes, context, or editorial commentary

---

### `ending` — Summary/closing scene

Use for the final `ending` segment.

```json
{
  "type": "ending",
  "startFrame": 1620,
  "durationFrames": 150,
  "audioSegment": { "start": 54.0, "end": 59.0, "text": "..." },
  "ending": {
    "badge": { "type": "summary" },
    "headline": "Điều này {thay đổi} gì?",
    "body": "Đây là lần đầu tiên trong lịch sử quan hệ Mỹ–Trung khi một tổng thống Mỹ đặt chân đến Trung Nam Hải."
  }
}
```

**`cta` field is REMOVED** — the subscribe button is now hardcoded in `SceneEnding.tsx` and always reads **"Bấm Theo Dõi"** with a 🔔 bell shake animation. Do NOT include a `cta` field in `spec.json` — it is ignored.

**Why**: The CTA always refers to following the current channel, not anything mentioned in the article. Hardcoding it prevents AI from writing article-specific follow-up text in the subscribe slot.
```

---

## Headline writing rules (applies to all scene types)

1. Keep it short: max 10 words for hook, max 12 for body/ending
2. Wrap 1–3 key terms in `{}` for red accent — typically: place names, key figures, numbers, or the most important noun
3. Avoid generic phrases — the headline must convey the specific fact
4. Use em dash `—` for juxtaposition (Vietnamese journalistic style)

**Good examples:**
- `"Lần đầu tiên trong {lịch sử} Mỹ — {Trung}"`
- `"Apple ra mắt {chip M5} — mạnh hơn {40%}"`
- `"{OpenAI} đàm phán mua lại {Windsurf} với giá {3 tỷ USD}"`

**Bad examples:**
- `"Đây là tin tức về cuộc gặp giữa hai lãnh đạo"` ← too long, no accent
- `"{Ông Tập} tiếp đón {ông Trump} tại {Trung Nam Hải}"` ← too many accents

---

## Badge type selection guide

| Scene content | Badge type |
|---|---|
| Breaking news, first time ever | `breaking` (TIN NÓNG) |
| Event, meeting, announcement | `event` (SỰ KIỆN) |
| Data, expert opinion, deep dive | `analysis` (PHÂN TÍCH) |
| Scoop, not yet reported elsewhere | `exclusive` (ĐỘC QUYỀN) |
| Follow-up to earlier story | `update` (CẬP NHẬT) |
| Final scene | `summary` (TÓM TẮT) |

---

## Video Title Rules

`spec.json → video.title`:
- Max 8 Vietnamese words
- Curiosity first, per Title rules in `docs/gen-video/common-pipeline.md`
- **Good**: `"Chip M5 của Apple nhanh hơn bao nhiêu?"`
- **Bad**: `"Sự kiện chấn động thế giới công nghệ hôm nay"` (vague, unsupported)

---

## Step 7 (Coder)

Coder agent does NOT design scenes. Instead:

1. Read `videos/<slug>/spec.json`
2. Import components from `src/templates/news/tech-light/`
3. Compose `VideoContent.tsx` using the exact pattern below
4. Update `src/Root.tsx` — only change `defaultSlug` and `defaultDuration`

### VideoContent.tsx pattern (use EXACTLY this):

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { Layout, SceneHook, SceneBody, SceneEnding } from '../templates/news/tech-light';
import type { NewsTechSpec } from '../templates/news/tech-light';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as NewsTechSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            {scene.type === 'hook'   && scene.hook   && <SceneHook   {...scene.hook} />}
            {scene.type === 'body'   && scene.body   && <SceneBody   {...scene.body} />}
            {scene.type === 'ending' && scene.ending && <SceneEnding {...scene.ending} />}
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

**Do NOT add custom animations, colors, or layout** — the template handles everything.

---

## Checklist before submitting spec.json

- [ ] `templateId` = `"news/tech-light"`
- [ ] `video.title` ≤ 8 Vietnamese words
- [ ] `video.bgMusic` = `"assets/news/music/news-ambient-01.mp3"` — NOT null
- [ ] `video.date` = publication date in `DD/MM/YYYY` format
- [ ] Every scene has: `type`, `startFrame`, `durationFrames`, `audioSegment`
- [ ] Hook scene has `hook` field; body scenes have `body` field; ending scene has `ending` field
- [ ] Every `image.src` is a real `.jpg`/`.jpeg`/`.png`/`.webp`/`.mp4` URL — not `.gif`, not fabricated
- [ ] Every image has `credit` (source name) filled in
- [ ] No `image` field present when no real URL is available
- [ ] `stat` used only when scene narrates a specific key number/percentage/price
- [ ] `stat.value` is a real number from the article — not invented
- [ ] `tags` array has max 4 short keywords — no full sentences
- [ ] Headline accent words `{}` are meaningful key terms (place, person, number, product name)
- [ ] `totalFrames` = last scene's `startFrame` + last scene's `durationFrames`
- [ ] No `cta` field in ending scene — subscribe button ("Bấm Theo Dõi" + 🔔) is hardcoded in the component
