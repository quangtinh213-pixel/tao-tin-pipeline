# Template Spec Rules: creative/demo-scroll

Read this document before Step 6 (Spec) and Step 7 (Coder) when
`creative/demo-scroll` or `creative/demo-scroll-sfx` is selected.

## Purpose

This template inherits every creative direction, timing, transition, layout,
safe-area, and verification rule from
[`creative/free-style`](free-style.md). It additionally requires one muted,
full-screen browser demo scene recorded from a supplied URL.

The `creative/demo-scroll-sfx` variant inherits the audio rules from
[`creative/free-style-sfx`](free-style-sfx.md) while keeping the recorded browser
demo itself muted.

## Variants

| Template ID | Audio mode | Use |
|---|---|---|
| `creative/demo-scroll` | voiceover only | Product walkthroughs where the narration and demo motion should stay clean |
| `creative/demo-scroll-sfx` | bgMusic + transition SFX | Product walkthroughs with a sound at every scene entry |

Both IDs use the same source components in
`src/templates/creative/demo-scroll`.

For `creative/demo-scroll`, set `video.bgMusic` to `null` and
`audioDesign.mode` to `silent`. Voiceover still renders normally.

For `creative/demo-scroll-sfx`, copy the configured `defaultBgMusic` from
`src/templates/registry.ts` and use a transition SFX at every scene entry.
The recorded browser demo video itself must remain muted.

## Input Contract

The generation context must identify:

- A public `http` or `https` demo URL.
- The product, feature, or subject shown by that URL.

Before Step 6, record the asset:

```bash
node scripts/record-demo.mjs "<url>" "<slug>"
node scripts/record-demo.mjs "<url>" "<slug>" --scroll-distance 1200 --scroll-duration 3 --hold-duration 1
```

This creates:

```text
public/<slug>/demo.mp4
public/<slug>/demo.json
```

The clip is always muted, 1080x1920, and approximately 14 seconds. Its default
motion schedule is deterministic:

```text
0s-3s:   scroll 1200px
3s-4s:   hold
4s-7s:   scroll another 1200px
7s-8s:   hold
8s-11s:  scroll another 1200px
11s-12s: hold
12s-14s: hold the final frame
```

The recorder never tries to reach the end of the page. A long page therefore
does not make the scroll faster. It always starts at the top and repeats the
same fixed scroll-and-hold cycle until there is not enough time for another
complete cycle.

## First-Mention Timing

The demo scene must begin at the first transcript segment that clearly mentions
the recorded product, feature, URL, or the act of showing the demo.

1. Search `public/<slug>/timeline.json` segments in chronological order.
2. Select the earliest semantically relevant segment, not merely the first
   occurrence of a generic word such as "website".
3. Make that transcript group a dedicated scene.
4. Set its `startFrame` using the Shared Timing Contract.
5. Do not start the demo clip earlier as background decoration.
6. If no segment clearly introduces the demo, halt and revise the script before
   creating the spec.

The browser clip itself has no audio. The generated voiceover and subtitles
remain controlled by the shared pipeline and the selected layout
(`FreeStyleLayout` for voiceover-only, `FreeStyleSfxLayout` for SFX).

## Audio Direction

### Voiceover-Only Variant

For `creative/demo-scroll`:

- Set `video.bgMusic` to `null`.
- Set `audioDesign.mode` to `silent`.
- Do not create `sfxEvents`.
- Do not add `transitionToNext.sfx`.
- Use `FreeStyleLayout` in Coder.

### SFX Variant

For `creative/demo-scroll-sfx`, follow the same audio contract as
`creative/free-style-sfx`:

- Set `video.bgMusic` to this template's configured `defaultBgMusic` in
  `src/templates/registry.ts`.
- Do not choose a track by story mood.
- Use transition SFX URLs exported by
  `src/templates/creative/demo-scroll` as `TRANSITION_SFX`.
- Every scene must define exactly one `entrySfx`, including the first scene.
- Use only `whoosh`, `whip`, or `pageTurn`.
- Default volumes: `whoosh = 0.18`, `whip = 0.15`, and
  `pageTurn = 0.20`.
- Custom volume may be used from `0.15-0.22`; runtime volume is capped at
  `0.25`.
- Do not use SFX for clicks, UI interactions, reveals, confirmations, impacts,
  errors, or any other non-transition moment.

Available SFX names:

| SFX name | Use for |
|---|---|
| `whoosh` | Smooth or energetic scene entry |
| `whip` | Sharp, fast scene change |
| `pageTurn` | Document, report, article, or chapter change |

## Step 6 Spec

Follow the free-style spec schema. For both variants, include `video.bgMusic`
and `audioDesign` so the Coder step can distinguish audio modes without
inferring from the template ID.

Voiceover-only example:

```json
{
  "templateId": "creative/demo-scroll",
  "video": {
    "title": "Vietnamese title",
    "date": "YYYY-MM-DD",
    "bgMusic": null
  },
  "audioDesign": {
    "mode": "silent",
    "sfxPalette": [],
    "sfxRules": "No background music or SFX. Voiceover only."
  },
  "demo": {
    "src": "<slug>/demo.mp4",
    "sourceUrl": "https://example.com",
    "firstMentionText": "Exact transcript text that introduces the demo",
    "startFrame": 420,
    "muted": true
  },
  "scenes": [
    {
      "type": "demo",
      "startFrame": 420,
      "durationFrames": 420,
      "audioSegment": {
        "start": 14,
        "end": 24,
        "text": "Exact transcript text that introduces the demo"
      },
      "visualConcept": "Full-screen live product walkthrough",
      "dominantElement": "Recorded browser demo",
      "elements": ["Muted demo.mp4", "Optional short LIVE DEMO label"],
      "transitionToNext": {
        "preset": "softFade",
        "durationFrames": 18,
        "reason": "The demo finishes once, fades out, and returns to normal content"
      }
    }
  ]
}
```

SFX example:

```json
{
  "templateId": "creative/demo-scroll-sfx",
  "video": {
    "title": "Vietnamese title",
    "date": "YYYY-MM-DD",
    "bgMusic": "assets/news/music/sonican-tech-news-information.mp3"
  },
  "audioDesign": {
    "mode": "sfx",
    "sfxPalette": [
      {"name": "whoosh", "reason": "Smooth scene entries"},
      {"name": "whip", "reason": "Sharp product scene changes"},
      {"name": "pageTurn", "reason": "Document-like scene changes"}
    ],
    "sfxRules": "Every scene has one entrySfx selected from whoosh, whip, or pageTurn."
  },
  "demo": {
    "src": "<slug>/demo.mp4",
    "sourceUrl": "https://example.com",
    "firstMentionText": "Exact transcript text that introduces the demo",
    "startFrame": 420,
    "muted": true
  },
  "scenes": [
    {
      "type": "demo",
      "startFrame": 420,
      "durationFrames": 420,
      "audioSegment": {
        "start": 14,
        "end": 24,
        "text": "Exact transcript text that introduces the demo"
      },
      "visualConcept": "Full-screen live product walkthrough",
      "dominantElement": "Recorded browser demo",
      "elements": ["Muted demo.mp4", "Optional short LIVE DEMO label"],
      "entrySfx": {
        "name": "whip",
        "volume": 0.15,
        "reason": "Introduces the dedicated product demo scene"
      },
      "transitionToNext": {
        "preset": "softFade",
        "durationFrames": 18,
        "reason": "The demo finishes once, fades out, and returns to normal content"
      }
    }
  ]
}
```

The demo scene must last exactly 420 frames. The recorded clip plays once and
fades out during the final 18 frames. Never loop, freeze, or reuse the demo
after it finishes. The next scene must return to normal free-style content.

If the transcript group that introduces the demo is shorter than 420 frames,
merge following narration into the demo scene. If it is longer, split remaining
narration into the normal content scene immediately after the demo.

## Step 7 Coder

Read the Remotion video and sequencing rules. For `creative/demo-scroll-sfx`,
also read `docs/remotion-best-practices/rules/audio.md` and
`docs/remotion-best-practices/rules/sfx.md`.

For `creative/demo-scroll`, import the template primitives:

```tsx
import {
  DemoVideoScene,
  FreeStyleLayout,
  addTransitionHandles,
  freeStyleTransition,
} from './templates/creative/demo-scroll';
```

For `creative/demo-scroll-sfx`, import:

```tsx
import {
  DemoVideoScene,
  FreeStyleSfxLayout,
  TRANSITION_SFX,
  addTransitionHandles,
  freeStyleTransition,
} from './templates/creative/demo-scroll';
```

Wrap the full video with `FreeStyleSfxLayout` only for the SFX variant:

```tsx
<FreeStyleSfxLayout
  slug={slug}
  background={spec.creativeDirection.palette.background}
  subtitleAccent={spec.creativeDirection.subtitleAccent}
  bgMusic={spec.video.bgMusic}
>
  ...
</FreeStyleSfxLayout>
```

Render one transition SFX at each scene start:

```tsx
{SCENE_ENTRY_SFX.map((event) => (
  <Sequence key={`${event.name}-${event.frame}`} from={event.frame} durationInFrames={90}>
    <Audio src={TRANSITION_SFX[event.name]} volume={Math.min(event.volume, 0.25)} />
  </Sequence>
))}
```

Use the recorded clip only in the dedicated first-mention scene:

```tsx
<DemoVideoScene
  src={`${slug}/demo.mp4`}
  durationInFrames={420}
  exitFrames={18}
  label="LIVE DEMO"
/>
```

Keep the clip muted and do not pass `loop`. The demo scene must be followed by
a normal content scene. All other scenes follow `creative/free-style`.

For `creative/demo-scroll`, do not import or render `TRANSITION_SFX`, and keep
`video.bgMusic` as `null`.

## Final Checklist

- [ ] All `creative/free-style` requirements pass
- [ ] `templateId` is `creative/demo-scroll` or `creative/demo-scroll-sfx`
- [ ] `creative/demo-scroll` sets `video.bgMusic = null` and
      `audioDesign.mode = "silent"`
- [ ] `creative/demo-scroll-sfx` sets `video.bgMusic` to a path from
      `public/assets/creative/manifest.json` and `audioDesign.mode = "sfx"`
- [ ] Every SFX-variant scene, including the first, has one `entrySfx`
- [ ] `creative/demo-scroll-sfx` renders `FreeStyleSfxLayout` and `TRANSITION_SFX`
- [ ] Transition SFX volume follows the per-sound defaults and is capped at `0.25`
- [ ] No non-transition SFX events are rendered
- [ ] `public/<slug>/demo.mp4` and `demo.json` exist
- [ ] Demo video is 9:16 and muted
- [ ] Motion uses repeated fixed scroll distance, fixed scroll time, and fixed hold time
- [ ] Recorder does not accelerate to reach the end of the page
- [ ] Demo scene begins at the first clear transcript mention
- [ ] Demo clip appears in exactly one dedicated scene
- [ ] Demo plays once, fades out, and never freezes or loops
- [ ] A normal content scene immediately follows the demo scene
