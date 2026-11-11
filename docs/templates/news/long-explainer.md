# Template Spec Rules: news/long-explainer

Read this document before Step 1, Step 2, Step 6, and Step 7 when
`--template news/long-explainer` is selected.

This is the **long-form lane** of VN News: a fixed 16:9 explainer of 8-12
minutes, split into chapters, built from one main news story plus a few
supporting sources. Shorts stay a separate lane (`news/media-showcase` and the
other 9:16 templates); never cut or reuse this template for a Short.

Format the channel tests (research 11/2026, outlier long-form explainers in
Vietnamese): one big verified news event → "what it changes for Vietnam / for
your money and daily life" → answered chapter by chapter with sourced numbers.

Command:

```text
/gen-video --template news/long-explainer --audio=full <main-url> [extra-url ...] [instructions]
```

## Input Contract

- The context contains one **main** public article URL (the first URL) and
  0-4 **supporting** public URLs (official documents, other outlets, data
  pages). Extra text is editorial instruction.
- The topic must carry an explainer question a viewer would ask ("vì sao",
  "ảnh hưởng gì đến bạn", "rồi sẽ ra sao"). A story with no explainer angle
  (single accident, single arrest) belongs in Shorts; stop and say so.

## Preflight / Acquisition

Immediately after Step 1, before Planner or TTS, run one extraction per URL:

```bash
node scripts/source-evidence.mjs "<main-url>" "<slug>"
node scripts/source-evidence.mjs "<supporting-url-2>" "<slug>-src2"
node scripts/source-evidence.mjs "<supporting-url-3>" "<slug>-src3"
```

Each call writes `videos/<evidenceSlug>/source-context.txt`,
`public/<evidenceSlug>/source-evidence.json` and its evidence files. The
`<slug>-srcN` folders only hold source material; they never get a render.

The maximum source-media coverage rules of
[`media-showcase.md`](media-showcase.md#maximum-source-media-coverage) apply to
every source. Stop before Planner/TTS when all sources together have zero
usable assets.

## Planner Override (Step 2)

Read `docs/gen-video/script-writing/START_HERE.md` for tone, then apply this
long-form contract instead of the Shorts beat model.

Planner reads every `source-context.txt` and `source-evidence.json`. Before
planning, sort facts into confirmed facts, attributed claims, and unresolved
details (internal only, as in `media-showcase.md`). Every number, name, and
quote in the plan must trace to one source file; note which.

`plan.json` keeps the common fields and adds:

```json
{
  "title": "Câu hỏi + con số: ... sẽ ra sao?",
  "question": "The one question the whole video answers",
  "chapters": [
    {"title": "Mở đầu: chuyện gì vừa xảy ra", "goal": "hook + the question"},
    {"title": "...", "goal": "..."}
  ]
}
```

- 5-8 chapters. Chapter 0 is the hook: the strongest verified fact and the
  question, no greeting, no channel intro, in at most ~40 seconds.
- Middle chapters each answer one sub-question, with at least one sourced
  number, date, or document per chapter.
- One chapter, near the end, states directly what this changes for viewers in
  Vietnam (prices, jobs, rules, safety), only as far as the sources support.
- The last chapter: what is still unknown, the next date to watch, then one
  open opinion question for comments. No "đăng ký kênh" line.
- Chapter titles are short (at most 48 characters), plain Vietnamese, and
  usable as YouTube chapter names.
- **Title:** follow the Title rules in `docs/gen-video/common-pipeline.md`.
  Preferred shape: verified big event or number, then a question about Vietnam
  or the viewer (e.g. "Mỹ áp thuế mới: 159 tỷ đô hàng Việt sẽ ra sao?"). Keep it
  under 90 characters.

## Teller Override (Step 3)

`script/script.json` uses the common schema plus a `chapter` index on every
entry:

```json
{
  "script": [
    {"text": "Hook sentence with the verified fact and the question.", "type": "hook", "chapter": 0},
    {"text": "40-70 word paragraph.", "type": "body", "chapter": 1},
    {"text": "Closing question.", "type": "ending", "chapter": 6}
  ]
}
```

- Total 1,400-2,200 words (about 8-12 minutes at speed 1.0). Never pad. If the
  sources are thin, make fewer chapters instead.
- 25-45 entries; each entry is one paragraph of 40-70 words (the timing
  script splits it into sentence beats). Entries are in chapter order; every chapter has at least two entries,
  except chapter 0, which may have one.
- The first entry is the hook (at most 22 words, the shared hook rule).
- Spoken style: short sentences, one fact per sentence, numbers said the way
  they are written in the source, attribution kept ("theo Reuters", "theo văn
  bản của ...").
- The legal/sensitive wording table in `media-showcase.md` applies.

Validate before TTS:

```bash
node scripts/script-rules.mjs videos/<slug>/script/script.json --max-words=2200
```

## Audio (Steps 4-5)

Use the common steps. The template's voice is the local **VieNeu-TTS** preset
`Thùy Dung` (registry `voice.vieneuVoice`, nữ Nam, news style, 48 kHz, no API key;
falls back to ElevenLabs, Gemini, Edge). To change the voice, edit
`voice.vieneuVoice` in the registry or set `VIENEU_VOICE` in `.env`
(`/update-template-voice` does not support VieNeu yet). Write
regions as "vùng một/hai/ba/bốn" or "vùng 1" when you can; "vùng I" is
normalized automatically. `scripts/tts.mjs` splits long scripts into several
provider requests and joins them, so one call still produces one `voice.mp3`.
For this template it keeps natural pauses (no dead-air trim): long-form needs
breathing room. Template voice speed is 1.0.

Recommended audio mode: `--audio=full`. Music stays under the voice and the
template adds its own narration-safe SFX (below). With `music` or
`voice-only`, set `video.sfx: false`.

STT must give real word timestamps (Groq or local Whisper). If `timeline.json`
ends more than 1s away from the `voice.mp3` duration, or contains sentences
that are not in the script, the transcript is broken: stop and fix STT before
Step 6; never build beats on it.

## Visual System (v2)

Research 11/2026 (outlier Vietnamese explainers) and two critique rounds with
Antigravity set this direction: the picture changes every 3-6 seconds, and
most of the screen time is **evidence** (the real article, highlighted),
**data** (moving numbers) and **kinetic type**, not a slideshow of the same
few photos.

The unit is a **beat**: one sentence or two short ones, 3-6s (data may hold
6-10s so a chart can be read). Each beat shows exactly one visual:

| `visual.type` | What it shows | Use for |
|---|---|---|
| `evidence` | Screenshot of the source article, zooming onto the quoted sentence, yellow marker sweeping across it, "Nguồn: báo · ngày" | Every claim the viewer should trust: a decision, a figure, an official statement |
| `data` | `bigNumber` count-up, `bars` (old → new or ranking), `equation`, `document` summary card, `calendar` date card, `timeline` | The numbers and dates the story turns on |
| `kinetic` | 3-12 big words, optional highlighted words and a lucide icon | The point of a sentence when no picture says it better; questions; transitions |
| `collage` | 1-3 photos with white border, hard shadow, slight tilt and slow parallax, credit strip | People, places and objects of the story |
| `quote` | Verbatim quote, speaker, optional portrait | A named person's exact words |

Choose each beat's visual by the **main subject affected** in that sentence
("người lao động nhận thêm bao nhiêu" → the worker or the money, not the
ministry building merely named in it).

Pacing rules (checked by the validator):

- Non-data beats at most 8s; data beats at most 10s. Split a long beat into
  two visuals when needed (beats may be split at any word boundary; keep
  `startFrame` on a word start from `timeline.json`).
- Never three beats of the same type in a row.
- Evidence is at least 20% of beats.
- Hook (first 30 seconds): cuts every 1.5-2.5s. Split the hook sentences into
  short beats: the headline evidence shots of the sources, one big number,
  one kinetic question. Words stay strictly factual (no fear beyond the
  source).
- Each chapter after the first opens with a 2s full-frame chapter card
  (automatic).

## Spec Override (Step 6)

1. Timing, never by hand:

   ```bash
   node scripts/long-explainer-timing.mjs "<slug>"
   ```

   `videos/<slug>/scene-timing.json` gets `totalFrames`, `chapters`, the
   entry `scenes`, and `beats` (sentence-level, tiling the whole video).

2. Evidence shots. For each claim to show, copy one sentence **verbatim** from
   a `source-context.txt` (it was extracted from the same page, so it matches
   the DOM). Also add one entry with an empty `quote` per source for the hook:
   it captures the headline.

   ```json
   [{"id": "ev-01", "url": "https://...", "quote": "Theo nghị định, lương tối thiểu tháng tại vùng I tăng từ 5,31 triệu lên 5,7 triệu đồng, cao nhất trong 4 vùng."},
    {"id": "hd-1", "url": "https://...", "quote": ""}]
   ```

   ```bash
   node scripts/capture-evidence.mjs "<slug>" "videos/<slug>/evidence-shots.json"
   ```

   Output: `public/<slug>/evidence-shots/<id>.png` and `shots.json` with the
   highlight line boxes. `found: false` means the sentence was not located:
   the shot shows the headline without a marker; use it only where that is
   honest. A page that times out is reported and skipped; re-run the failed
   ids alone (results merge by id). Copy each shot into `spec.evidenceShots`
   and add `label` ("VnExpress · 3/11/2026", the article date).

3. Photos: every relevant usable asset from all sources (rules of
   `media-showcase.md`), ids prefixed by source (`s1-`, `s2-`). Wikimedia
   Commons photos are allowed only under PD, CC0, CC BY or CC BY-SA, with
   `credit` "Ảnh: <tác giả> · <giấy phép> · Wikimedia Commons". Article photos
   always carry their outlet's credit and are never used as the thumbnail.

4. Write the spec:

```json
{
  "templateId": "news/long-explainer",
  "slug": "<slug>",
  "fps": 30,
  "totalFrames": 11964,
  "video": {"title": "...", "date": "7.11.2026", "bgMusic": "assets/news/music/nastelbom-soft-music.mp3", "sfx": true, "width": 1920, "height": 1080},
  "sources": [{"url": "https://...", "publisher": "VnExpress", "evidenceSlug": "<slug>"}],
  "chapters": [{"title": "Mở đầu: lương bạn có tăng không?", "startFrame": 0}],
  "mediaAssets": [{"id": "s1-image-02", "kind": "image", "src": "<slug>/evidence/image-02.jpg", "credit": "Ảnh: Quỳnh Trần · VnExpress", "width": 2040, "height": 1360, "storage": "local", "sourcePageUrl": "https://...", "sourceMediaUrl": "https://..."}],
  "evidenceShots": [{"id": "ev-02", "src": "<slug>/evidence-shots/ev-02.png", "url": "https://...", "width": 1600, "height": 900, "found": true, "rects": [{"x": 145, "y": 405, "w": 340, "h": 21}], "focus": {"x": 145, "y": 405, "w": 340, "h": 44}, "label": "VnExpress · 3/11/2026"}],
  "beats": [
    {"startFrame": 0, "durationFrames": 80, "chapterIndex": 0, "text": "...", "visual": {"type": "evidence", "shotId": "hd-1"}},
    {"startFrame": 80, "durationFrames": 70, "chapterIndex": 0, "text": "...", "visual": {"type": "data", "graphic": {"kind": "bigNumber", "value": 390000, "unit": "đồng", "label": "...", "source": "VnExpress"}}},
    {"startFrame": 150, "durationFrames": 60, "chapterIndex": 0, "text": "...", "visual": {"type": "kinetic", "text": "Ai thực sự được tăng?", "highlight": "tăng", "icon": "Wallet"}},
    {"startFrame": 210, "durationFrames": 150, "chapterIndex": 0, "text": "...", "visual": {"type": "collage", "photos": [{"assetId": "s1-image-02"}], "kicker": "Lương sàn"}}
  ]
}
```

Rules:

- `beats` tile `0..totalFrames` exactly; every chapter `startFrame` is a beat
  start. `chapterIndex` and `text` come from `scene-timing.json`.
- `data` graphics: every number appears in a source (the validator checks
  digits). A derived figure says so: `source` starts with "tính từ số liệu".
  `document` is a summary card, never a copy of a real seal or signature, and
  its `source` starts with "Đồ họa tóm tắt".
- `kinetic.icon` is a lucide-react icon name (`Wallet`, `Gavel`, `Factory`,
  `Landmark`, `Banknote`, `Calendar`, `TrendingUp`, `Users`, `ShieldCheck`,
  `FileText`, `MapPin`, `Scale`...). Kinetic text summarizes the narration; no
  new facts.
- `quote.text` is verbatim from a source (checked).
- `video.width`/`height` are 1920/1080: the uploaders then treat the video as
  long-form (no `#Shorts`, no Facebook Reel, chapters + SRT captions).

Validate before rendering:

```bash
node scripts/validate-long-explainer.mjs "<slug>"
```

## Caption (post-Spec)

Run the common caption phase unchanged (`generate-caption.mjs`,
`validate-caption.mjs`). Do not write chapters into `caption.txt`:
`scripts/youtube-upload.mjs` appends the chapter list from `spec.chapters`
and the source URLs from `spec.sources`, and uploads `captions.vi.srt`
generated from `timeline.json` as a YouTube caption track.

## Coder Override (Step 7)

No per-video code. The composition is fixed:
`src/templates/news/long-explainer/LongExplainerVideo.tsx`, registered by its
own entry point `src/long-explainer-root.tsx` (composition `LongExplainer`).
Do not edit `src/Root.tsx` or `src/VideoContent.tsx`: those belong to the
Shorts templates, and a long-form render must never overwrite them. Subtitles
are not burned in (captions ship as an SRT track). Run `npx tsc --noEmit`.

## Verification Override (Step 8)

Render stills of the first frame, one beat of each visual type used, one
chapter card and the last beat:

```bash
npx remotion still src/long-explainer-root.tsx LongExplainer <out>.png --frame=<n> --props '{"slug":"<slug>"}'
```

Check: highlight sits on the quoted line, no text overflow, collage credits
readable, top bar shows the right chapter. Then render (8 Mbps is YouTube's
1080p30 target; hardware encoding otherwise writes ~20 Mbps). Run it in the
background:

```bash
npx remotion render src/long-explainer-root.tsx LongExplainer \
  --output "videos/<slug>/output/video.mp4" \
  --codec h264 --hardware-acceleration if-possible --x264-preset faster \
  --video-bitrate 8M \
  --props '{"slug":"<slug>"}'
```

## Visual Contract

- 1920x1080. Dark slate background (`#0F172A`) with a faint 40px grid; red
  `#EF4444` accent; marker yellow `#FACC15`; headings in Barlow Condensed,
  body in Be Vietnam Pro.
- Thin top bar: chapter number + title, chapter progress, logo.
- Collage photos: 5px white border, hard shadow, tilt within ±2.5°, parallax
  scale 1 → 1.03 and at most 15px drift per beat.
- Narration-safe SFX (when `video.sfx` is not false): page turn + marker on
  evidence, ding when a count-up lands, a soft click on kinetic beats, whoosh
  into each chapter.

## Checklist

- [ ] Main URL plus 0-4 supporting URLs; the topic has an explainer question.
- [ ] `source-evidence.mjs` ran for every URL before Planner/TTS.
- [ ] 5-8 chapters; the hook comes first; a "what this changes for you" chapter; ends with an open question.
- [ ] `script-rules.mjs --max-words=2200` passed; every entry has `chapter`.
- [ ] `timeline.json` matches the voice (real word timestamps, no invented sentences).
- [ ] `long-explainer-timing.mjs` beats copied into the spec; hook beats split to 1.5-2.5s.
- [ ] `capture-evidence.mjs` shots checked: the marker sits on the quoted sentence.
- [ ] `validate-long-explainer.mjs` passed.
- [ ] Every visible photo has its credit; Wikimedia photos carry author + license.
- [ ] Stills checked; TypeScript compiles; render exists.
