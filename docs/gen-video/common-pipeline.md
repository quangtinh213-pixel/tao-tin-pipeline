# Gen Video Common Pipeline

Read this document for the shared operational steps. Visual design and scene
implementation rules belong to the selected template document.

## Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `ASPECT_RATIO` | No | `9:16` | `9:16` or `16:9` |
| `THEME` | No | `dark` | `dark` or `light` |
| `SHOW_SUBTITLES` | No | `true` | Hide only when explicitly set to `false` |
| `ELEVENLABS_API_KEY` | No* | - | Primary TTS provider |
| `ELEVENLABS_VOICE_ID` | No | provider default | ElevenLabs voice |
| `TTS_PROVIDER` / `VIENEU_VOICE` / `VIENEU_DIR` | No | - | `vieneu` makes local VieNeu-TTS the first provider (default voice `Thùy Dung`, repo at `~/Documents/VieNeu-TTS`); a template's `voice.vieneuVoice` does the same for that template |
| `GEMINI_API_KEY` | No* | - | Fallback TTS provider |
| `GEMINI_TTS_VOICE` | No | `Achird` | Gemini voice |
| `EDGE_TTS_VOICE` | No | `vi-VN-NamMinhNeural` | Edge TTS voice, last-resort provider (no key; needs `edge-tts` + ffmpeg) |
| `GROQ_API_KEY` | No* | - | Primary STT provider |
| `GROQ_STT_MODEL` | No | `whisper-large-v3-turbo` | Groq STT model |
| `STT_API_KEY` | No* | - | Fallback api.stt.ai Bearer token |
| `STT_LANGUAGE` | No | `vi` | STT language |

At least one TTS provider is required. Priority is VieNeu-TTS (only when enabled, local, no key), then ElevenLabs, then Gemini, then Edge TTS.
At least one STT key is required. Provider priority is Groq, then api.stt.ai.

## Step 1: Setup

1. Parse and remove command flags before treating the remaining text as context:
   - `--template <template-id>`
   - `--audio=full`, `--audio=music`, `--audio=sfx`, or `--audio=voice-only`
   - reject unknown/repeated audio values instead of guessing
   - halt with the usage message if no clean context remains
2. Derive `<slug>` from the clean context:
   - lowercase
   - replace spaces with `-`
   - remove non-`[a-z0-9-]`
   - keep the first 8 tokens
   - prefix `YYYY-MM-DD`
3. Halt if `videos/<slug>/` already exists.
4. Create:

```text
videos/<slug>/script/
videos/<slug>/output/
public/<slug>/
```

5. Write only the clean context, without command flags, to
   `videos/<slug>/context.txt`.
6. Select a template:
   - explicit `--template`: validate it in `src/templates/registry.ts`
   - no flag: use `creative/free-style`
7. Write the selected ID to `videos/<slug>/template.txt`.
8. Resolve the audio policy and write it to `videos/<slug>/audio.txt`:
   - explicit `--audio=<mode>`: write `<mode>`
   - omitted flag: write `template`

`audio.txt` is the durable source of truth for Steps 6-8. The accepted contents
are `template`, `full`, `music`, `sfx`, and `voice-only`.

Templates that acquire article media may add template-specific artifacts after
this step. Follow the selected template document before starting Planner.

## Step 2: Planner

Before drafting, read
[`script-writing/START_HERE.md`](script-writing/START_HERE.md) and the base
rules in [`script-writing/SCRIPT_RULES.md`](script-writing/SCRIPT_RULES.md).
They govern hook quality, segment focus, and voice; they never change the
schema below.

Input: `videos/<slug>/context.txt`

Output: `videos/<slug>/plan.json`

```json
{
  "title": "Vietnamese title",
  "hook": "Attention-grabbing opening",
  "segments": [
    {"title": "Segment title", "content_summary": "Segment purpose"}
  ],
  "ending": "Closing idea",
  "estimated_duration": 60
}
```

Rules:

- Vietnamese, informative, and neutral unless context requires another tone.
- Target 45-100 seconds. **News templates (`news/*`): target 20-35 seconds**
  (about 75-125 Vietnamese words of narration, 2-3 body segments;
  `scripts/script-rules.mjs` rejects more than 140 words, ~37s at the
  channel's ~3.75 words/second). VN News Analytics: videos that broke past
  ~1,500 views held ~70%+ average view percentage; 60s+ videos held the
  least (~47%). The 20-35s format started on 3/11/2026; its first 10 videos
  matched the older 50-60s ones on views, so re-check retention with
  `scripts/yt-report.mjs` before changing this range. Never pad to reach the
  range; cut the weakest facts instead.
- Use 3-6 body segments, excluding hook and ending (news: 2-3).
- News hook: the strongest image or the sharpest question lands in the first
  seconds (at most 22 words, see `script-writing/SCRIPT_RULES.md` §2.1), with no greeting, no long intro and no music
  lead-in. Hold the payoff (result, twist, verdict, or the answer to the hook)
  for the last body segment or the ending so viewers stay to the final second.
- The hook must create immediate curiosity.
- Pick the segment arc from
  [`script-writing/SCRIPT_PATTERNS.md`](script-writing/SCRIPT_PATTERNS.md)
  based on story shape (breaking news, explainer, product update, warning,
  or human-interest), not the visual template category.
- `title` (later `spec.json → video.title`, also the YouTube title) follows
  the Title rules below.

### Title rules

The title's job is to make the viewer stop scrolling and watch. Prioritize
curiosity and a strong pull over a neutral print-style headline. Do not copy
the article headline verbatim; rewrite it with one of these techniques:

- **Curiosity gap:** state the situation but hold back the key detail the
  video answers (the amount, the reason, the outcome, who is affected).
- **Direct address:** speak to the viewer ("bạn", "nhà bạn", "người đi xe máy").
- **Contrast or paradox:** put two facts side by side that seem not to fit.
- **Striking verified number first:** lead with the most surprising figure.
- **Question:** ask what the viewer is already wondering.

Emotional words such as "bất ngờ", "gây tranh cãi", "lo ngại", "hiếm thấy"
are allowed only when the source supports them.

Hard limits — a title that breaks one is rejected, however catchy:

- Every fact, number, name, and qualifier is verified in the source. Never
  invent a claim, scale, motive, outcome, or reaction.
- The video must answer the curiosity the title opens. No bait-and-switch.
- No unsupported "sốc", "chấn động", "kinh hoàng", "sự thật phía sau".
- Keep legal status precise: no guilt before conviction, keep "bị cáo buộc",
  "nghi", "đang điều tra". Never identify a minor or use graphic detail.
- Health, safety, and public-policy titles may create urgency but must not
  spread fear beyond what the source states.
- Keep the template's length limit (word or character cap) and Vietnamese
  diacritics.

| Neutral headline (avoid) | Curiosity title (prefer) |
| --- | --- |
| Hơn 2,5 triệu người nộp thuế chưa hoàn tất đóng mã số thuế | 2,5 triệu người chưa làm thủ tục thuế này, bạn có trong số đó? |
| Doanh nghiệp Hải Phòng lên phương án thưởng Tết 2027 | Thưởng Tết 2027 ở Hải Phòng sẽ được bao nhiêu? |
| Tài xế bị phạt vì lỗi khi dừng đèn đỏ | Đã dừng đèn đỏ vẫn bị phạt 18-20 triệu đồng |

## Step 3: Teller

Apply the same `script-writing/` rules read for Planner. Optionally pick one
tone from [`script-writing/STYLE_INDEX.md`](script-writing/STYLE_INDEX.md) if
the story calls for a specific voice; the neutral briefing default applies
otherwise.

Input: `videos/<slug>/plan.json`

Output: `videos/<slug>/script/script.json`

```json
{
  "script": [
    {"text": "Narration", "type": "hook"},
    {"text": "Narration", "type": "body"},
    {"text": "Narration", "type": "ending"}
  ]
}
```

Rules:

- `type` is `hook`, `body`, or `ending`.
- Every text entry is non-empty Vietnamese.
- Total spoken duration should remain 45-100 seconds; 20-35 seconds for
  `news/*` templates. Cut facts rather than run long.
- Run the `script-writing/SCRIPT_RULES.md` §10 checklist before treating
  `script.json` as final.

## Step 4: Audio

If `public/<slug>/voice.mp3` exists, reuse it. Otherwise run:

```bash
node scripts/tts.mjs "videos/<slug>/script/script.json" "<slug>"
```

The script automatically selects the first configured provider. A template voice
from `src/templates/registry.ts` overrides the generic environment voice.

Verify `public/<slug>/voice.mp3` exists.

### Audio Reuse Guard

`voice.mp3` is an expensive generated artifact and is the source of truth once it
exists. Never regenerate voiceover merely because the duration is longer or
shorter than the target range. If the generated narration duration is outside the
target (45-100 seconds, or 20-35 seconds for `news/*`), continue with the existing audio and adapt Step 6 timing,
scene count, pacing, and final render duration to `timeline.json`.

Only overwrite `voice.mp3` when the user explicitly asks to regenerate the
voiceover, for example after changing the voice, script, or provider. In that
case run:

```bash
node scripts/tts.mjs "videos/<slug>/script/script.json" "<slug>" --force
```

Do not call `--force` as an automatic fix for video length.

## Step 5: Transcribe

Run:

```bash
node scripts/transcribe.mjs "<slug>"
```

The script uses Groq first when `GROQ_API_KEY` is set, then falls back to
api.stt.ai when `STT_API_KEY` is set.

Output: `public/<slug>/timeline.json`

```json
{
  "duration": 68.4,
  "segments": [
    {"start": 0, "end": 2.4, "text": "Exact transcript segment"}
  ],
  "words": [
    {"word": "Exact", "start": 0, "end": 0.3}
  ]
}
```

- `segments` drive scene timing.
- `words` drive word-level subtitles.
- Verify the file exists before continuing.

## Shared Timing Contract

Use `timeline.json` as the only timing source.

1. Map script entries to transcript segments sequentially.
2. If transcript segments outnumber script entries, group consecutive segments.
3. If script entries outnumber transcript segments, split the longest suitable
   segment.
4. Set the first scene's `startFrame` to `0`. Set later scene boundaries from
   the start of their mapped transcript groups:

```text
firstScene.startFrame = 0
laterScene.startFrame = Math.round(groupStartSeconds * 30)
```

5. Calculate:

```text
totalFrames = Math.ceil(timeline.duration * 30) + 60
```

6. Derive sequence durations from scene boundaries:

```text
nonFinalDuration = nextScene.startFrame - currentScene.startFrame
finalDuration    = totalFrames - finalScene.startFrame
```

7. Preserve the transcript group's actual `start`, `end`, and `text` in the
   scene's `audioSegment`.
8. Ensure scene boundaries are strictly increasing. Merge or adjust a boundary
   if rounding produces a zero-length scene.
9. Scene durations used by the composition must sum exactly to `totalFrames`.
10. Do not add overlap buffers directly to scene durations. If transitions overlap
   sequences, compensate using the selected template's transition-duration
   helper.

Do not duplicate or redefine this timing algorithm in template documents.

## Caption Artifact (post-Spec, pre-Coder)

After `videos/<slug>/spec.json` passes verification and before Coder, read
[`caption-sop.md`](caption-sop.md) and generate the local social caption:

```bash
node scripts/generate-caption.mjs "<slug>"
```

This writes `videos/<slug>/caption.txt` from the verified title, source,
plan, and script. The generator uses a deterministic Vietnamese phrase bank for
young audiences; it does not call a trend API, invent facts, or publish to a
social platform. Validate it before continuing:

```bash
node scripts/validate-caption.mjs \
  "videos/<slug>/caption.txt" \
  "videos/<slug>/spec.json" \
  "videos/<slug>/script/script.json"
```

The validator requires 100–180 words, Hook–Content–CTA structure, an open
question CTA, source/verification language for hot or legal stories, and the
channel hashtag `#VnNews213`.

## Step 8: Render

Run from project root:

```bash
npx remotion render src/Root.tsx Video \
  --output "videos/<slug>/output/video.mp4" \
  --codec h264 \
  --hardware-acceleration if-possible \
  --x264-preset faster \
  --props '{"slug":"<slug>"}'
```

> **Note:** `remotion.config.ts` at the project root provides default
> optimizations (concurrency, JPEG frames, offthread video cache). The CLI
> flags above are the minimum required overrides; the config file handles the
> rest automatically.

Verify `videos/<slug>/output/video.mp4` exists.

If `YOUTUBE_AUTO_UPLOAD=true` in `.env`, automatically upload the new video:

```bash
node scripts/youtube-upload.mjs "<slug>"
```


## Shared Failure Rules

- Missing required input: report the missing path and halt.
- Missing or invalid `videos/<slug>/caption.txt`: report the rule errors and
  halt before Coder.
- External API failure: report provider, status, and relevant response body.
- Non-zero command exit: report stderr and halt.
- Never render before TypeScript and visual verification pass.
