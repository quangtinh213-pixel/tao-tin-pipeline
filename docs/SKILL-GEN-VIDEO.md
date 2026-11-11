# /gen-video [--template <id>] [--audio=<mode>] <context> - Video Generation Router

## Trigger

Run when the user types:

```text
/gen-video <context>
/gen-video --template <template-id> <context>
/gen-video --audio=<mode> <context>
/gen-video --template <template-id> --audio=<mode> <context>
```

`<mode>` must be one of `full`, `music`, `sfx`, or `voice-only`. Flags may
appear before the context in either order. Strip recognized flags before
validating or writing the context.

## Article-Link Shortcut

When the user's message is only one public `http` or `https` article/content
page URL, or that URL plus a request to create a video, treat it as the
following implicit command:

```text
/gen-video --template news/media-showcase --audio=full <context>
```

Keep the URL and any additional video instructions as the generation context.
The shortcut requires exactly one primary article URL and does not apply when
the user is asking to summarize, translate, analyze, inspect, or otherwise use
the article without requesting a video. Explicit `--template` / `--audio` flags
always take precedence. If the user types `/gen-video <article-url>` without
those flags, apply the same shortcut defaults.

The selected template document defines any additional input contract, such as a
required public URL, article page, media source, or demo target. Do not encode
template-specific input rules in this router.

For article-based runs that acquire source media, preflight must maximize
source coverage before Planner or TTS: inspect all declared public discovery
paths, do not stop after the first few assets, and do not apply a top-N or
arbitrary media cap. The selected template remains responsible for deciding
which candidates are relevant and usable, but it must not silently discard a
relevant source asset merely to simplify planning or rendering.

## Core Model

Every generation uses a registered template and writes `videos/<slug>/spec.json`.

- Without `--template`, use `creative/free-style`.
- With `--template`, validate the ID in `src/templates/registry.ts`.
- Without `--audio`, use the selected template's existing audio contract.
- For the Article-Link Shortcut, resolve the omitted flags to
  `news/media-showcase` and `full` before applying the rules below.
- With `--audio`, apply the generic Audio Mode Contract below. It overrides
  conflicting music or SFX requirements in the selected template document.
- The registry `behavior` field identifies whether the template is `fixed`,
  `hybrid`, or `creative`.
- The selected template document is the source of truth for visual decisions,
  input requirements, lifecycle hooks, spec schema, and coder workflow.

Templates fall into three behavior classes:

| Class | AI freedom |
|---|---|
| Fixed | Fill the provided schema and use existing template components |
| Hybrid design system | Preserve the style system, but create content-specific scenes when required |
| Creative direction | Design and code a new visual language for the video |

Do not assume all templates are fixed. Read the selected template document.

## Audio Mode Contract

The narration track is always generated and rendered. `--audio` controls
background music and generated transition SFX:

| Flag | Background music | Transition SFX |
|---|---:|---:|
| `--audio=full` | Yes | Yes |
| `--audio=music` | Yes | No |
| `--audio=sfx` | No | Yes |
| `--audio=voice-only` | No | No |
| omitted | Template default | Template default |

This contract applies to every registered template; do not create duplicate
template IDs merely to represent an audio mode.
When checking a template-specific completion checklist, reinterpret its
music/SFX assertions through this contract whenever `audio.txt` is not
`template`.

- Music-enabled modes must set `video.bgMusic` to the selected template's
  configured `defaultBgMusic` from `src/templates/registry.ts`. If the selected
  template has no configured default music, use
  `assets/news/music/sonican-tech-news-information.mp3` from
  `public/assets/creative/manifest.json`. Halt if that fallback track is not
  available.
- Music-disabled modes must set `video.bgMusic` to `null` and pass `null` to
  the template layout.
- SFX-enabled modes should use a template's native SFX system when available.
  Otherwise use the shared curated scene-entry SFX contract from
  `src/templates/creative/free-style-sfx`: add one meaningful `entrySfx` cue to
  every scene and render it at that scene's `startFrame`.
- SFX-disabled modes must omit SFX cues and must not render an SFX audio layer.
- Some existing creative spec schemas expose `audioDesign.mode` with only the
  legacy values `silent | sfx`. Treat that field as an SFX switch, not as the
  complete audio policy:
  - `full` or `sfx` → `audioDesign.mode: "sfx"`
  - `music` or `voice-only` → `audioDesign.mode: "silent"`
  - `template` → preserve the selected template's existing value
  - regardless of this legacy field, `video.bgMusic` and `audio.txt` decide
    whether background music renders
- Keep SFX restrained and narration-safe. Do not add meme, error, confirmation,
  impact, or decorative UI sounds.
- The flag does not mute narration. Source-media audio explicitly required by a
  template keeps following that template's media contract.

## Template Lifecycle Hooks

Templates may override the common pipeline through instructions in their own
`specDocPath`. Treat the following as optional hooks:

| Hook | When it runs | Typical responsibility |
|---|---|---|
| Input contract | Before Step 1 | Validate required URLs, media, or other context |
| Preflight / acquisition | Immediately after Step 1 | Fetch or inspect source assets before planning |
| Planner / Teller override | Steps 2-3 | Replace common segment count, inputs, or script structure |
| Early completion / stop | At the point declared by the template | Stop successfully or fail before unnecessary TTS/STT/render work |
| Spec override | Step 6 | Define template-specific schema and asset mapping |
| Coder override | Step 7 | Select fixed components or content-specific implementation |
| Verification override | Step 8 | Add template-specific frame or media checks |

If a hook is absent, use the common pipeline unchanged. A hook may override only
the phase it explicitly covers; all other common rules still apply.

When adding a template, put special behavior in that template's document, not in
this router. The router should change only when the pipeline itself gains a new
generic phase or hook type.

## Progressive Loading

Read only the documents required for the current step:

1. Read this router first.
2. Resolve the selected registry entry and read its `specDocPath`. Identify its
   input contract and lifecycle hooks before running Step 1.
3. Read [`gen-video/common-pipeline.md`](gen-video/common-pipeline.md) for Steps
   1-5, the Caption phase, and Step 8. Before drafting `plan.json` in Step 2,
   read [`gen-video/script-writing/START_HERE.md`](gen-video/script-writing/START_HERE.md).
   Read [`gen-video/caption-sop.md`](gen-video/caption-sop.md) before generating the
   social caption. Apply only the hooks declared by the selected template.
4. If registry `behavior` is `creative` or `hybrid`, read
   [`gen-video/creative-quality-contract.md`](gen-video/creative-quality-contract.md).
5. Before coding Remotion, read `docs/remotion-best-practices/SKILL.md`, then only the rule files needed by the selected design.
6. Before final render, read [`gen-video/verification.md`](gen-video/verification.md).

Do not load every template document or every Remotion rule.

## Execution

### Steps 1-5: Content And Audio

Follow `docs/gen-video/common-pipeline.md`:

1. Setup generation directories and choose the template.
   Then execute the selected template's preflight/acquisition hook, if present,
   including any declared early-stop condition.
2. Create `plan.json`.
   Apply the selected template's Planner override, if present; otherwise use the
   common Planner contract.
3. Create `script/script.json`. Apply the selected template's Teller override,
   if present; otherwise use the common Teller contract. For `news/*`, run
   `node scripts/script-rules.mjs videos/<slug>/script/script.json` and rewrite
   the hook (and `plan.json.hook`) or cut the weakest facts until it passes,
   before TTS.
4. Generate or reuse `voice.mp3`. Reuse is mandatory when the file already
   exists; do not regenerate audio to fix duration.
5. Generate `timeline.json`.

### Step 6: Spec

Inputs:

- `videos/<slug>/template.txt`
- `videos/<slug>/audio.txt`
- `videos/<slug>/plan.json`
- `videos/<slug>/script/script.json`
- `public/<slug>/timeline.json`

Process:

1. Read the selected template ID from `template.txt`.
2. Read and validate the resolved audio policy from `audio.txt`. Treat a
   missing or invalid file as a missing required input and halt.
3. Find its `specDocPath` in `src/templates/registry.ts`.
4. Reuse the selected template document loaded before Step 1 and apply its Spec
   override. Re-read only the relevant section if needed.
5. If registry `behavior` is `creative` or `hybrid`, also read
   `docs/gen-video/creative-quality-contract.md`.
6. Derive timing using the shared timing contract in
   `docs/gen-video/common-pipeline.md`.
7. Apply the Audio Mode Contract after template-specific spec rules so an
   explicit `--audio` value wins over conflicting template defaults.
   Do not ask the AI to choose background music by story mood; copy the
   configured `defaultBgMusic` from `src/templates/registry.ts` whenever music
   is enabled.
8. Write `videos/<slug>/spec.json`.

Verify that every scene has audio-derived timing and that scene durations sum to
`totalFrames`.

If `timeline.json` reports a duration outside the desired short-form target,
adapt the video to the existing audio instead of going back to Step 4. Adjust
scene grouping, visual pacing, and `defaultDuration`; never regenerate
`voice.mp3` unless the user explicitly requested an audio overwrite.

### Caption

Run this phase after `spec.json` has been verified and before Step 7: Coder.
Read [`gen-video/caption-sop.md`](gen-video/caption-sop.md) and use only the
verified context, plan, script, and spec metadata as inputs. The caption phase
does not make a network request, research live trends, or publish to a social
platform.

Inputs:

- `videos/<slug>/context.txt`
- `videos/<slug>/plan.json`
- `videos/<slug>/script/script.json`
- `videos/<slug>/spec.json`
- `docs/gen-video/caption-sop.md`

Run:

```bash
node scripts/generate-caption.mjs "<slug>"
```

Output: `videos/<slug>/caption.txt`. Validate the generated artifact before
continuing:

```bash
node scripts/validate-caption.mjs \
  "videos/<slug>/caption.txt" \
  "videos/<slug>/spec.json" \
  "videos/<slug>/script/script.json"
```

The validator must confirm 100–180 words, Hook–Content–CTA formatting, a
trending-but-grounded Vietnamese tone for young audiences, an open CTA,
source/verification language for hot or legal stories, and mandatory
`#VnNews213`. A missing or invalid caption halts the workflow before Coder.

### Step 7: Coder

Inputs:

- `videos/<slug>/spec.json`
- selected template document
- `public/<slug>/timeline.json`
- `public/<slug>/voice.mp3`

Process:

1. Read the selected template's coder workflow.
2. Read `docs/remotion-best-practices/SKILL.md`.
3. Read only relevant Remotion rules, such as animations, sequencing, charts,
   subtitles, transitions, images, or fonts.
4. Remove stale generated scene files only when the selected template workflow
   requires regenerating `src/scenes/`.
5. Implement the spec.
6. Enforce the resolved audio policy from `audio.txt`: render exactly the
   requested music/SFX layers and do not infer audio behavior only from a
   template ID suffix or legacy `audioDesign.mode`.
7. Update only `defaultSlug` and `defaultDuration` in `src/Root.tsx`, unless the
   selected template explicitly requires another change.
8. Run `npx tsc --noEmit`.

Template behavior:

- **Fixed template:** do not introduce unrelated colors, layouts, or animations.
- **Hybrid template:** preserve its design system and create custom scenes as
  required by its template document.
- **Creative template:** create distinct content-driven scenes and satisfy the
  creative quality contract.

### Step 8: Verify And Render

1. Follow `docs/gen-video/verification.md`.
2. Fix visual collisions, overflow, unreadable text, timing issues, and weak
   scenes before final render.
3. Render using Step 8 in `docs/gen-video/common-pipeline.md`.
4. If `YOUTUBE_AUTO_UPLOAD=true` in `.env`, run `node scripts/youtube-upload.mjs "<slug>"`
   to upload the rendered video to the VNNews YouTube channel.
5. If `FACEBOOK_AUTO_UPLOAD=true` in `.env`, run `node scripts/facebook-reel-upload.mjs "<slug>"`
   to publish the rendered video as a Facebook Page Reel.

## Completion Contract

A generation is complete only when:

- `videos/<slug>/audio.txt` exists and contains the resolved audio policy.
- `videos/<slug>/spec.json` exists.
- `videos/<slug>/caption.txt` exists and passes `validate-caption.mjs` before
  Coder starts.
- For `news/*`, `script/script.json` (hook and total length) passed
  `script-rules.mjs` before TTS.
- `public/<slug>/voice.mp3` and `public/<slug>/timeline.json` exist.
- TypeScript compiles.
- Required representative frames were inspected when required by verification rules.
- Scene timing matches the audio-derived total duration.
- `videos/<slug>/output/video.mp4` exists.

On success, report:

```text
Pipeline complete. Output: videos/<slug>/output/video.mp4
```

## Error Handling

- Empty context: report correct usage and halt.
- Unknown template ID: list IDs from `src/templates/registry.ts` and halt.
- Unknown or repeated `--audio` value: report the four accepted values and halt.
- Existing generation directory: report the conflict and halt.
- Failed pipeline step: report the step and relevant stderr, then halt.
- Missing or invalid `videos/<slug>/caption.txt`: report the caption validation
  errors and halt before Coder.
- Do not silently skip failed verification or rendering.
