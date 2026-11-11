# Template Spec Rules: creative/free-style

Read this document before Step 6 (Spec) and Step 7 (Coder) when
`creative/free-style` is selected explicitly or as the default template.

---

## Purpose

This is a **creative direction template**, not a fixed visual component set.

Every generation must design and code a new visual language from the supplied content. The template only standardizes:

- Audio and timestamp-driven scene timing
- Persistent watermark from `public/watermark.png`
- Subtitle overlay
- Watermark and subtitle safe zones
- Professional icon/logo sourcing
- Content-driven transitions between scenes

Do not reuse one generic card or one layout for every scene. Do not import scene components from a previous generated video.

Read `docs/gen-video/creative-quality-contract.md` before creating the spec or
custom scenes. That contract defines the quality bar without imposing a fixed
layout.

---

## Creative Freedom

The agent may freely choose per video and per scene:

- Color palette, gradients, textures, visual density, typography scale
- Scene composition and information hierarchy
- Motion language: kinetic typography, diagrams, simulations, timelines, counters, browser/phone mockups, particles, charts, filmstrips, split screens, or other content-relevant visuals
- Different layout and animation systems for different scenes

Every decision must follow the meaning and emotional tone of the narration.

### Visible language contract

All viewer-facing text generated for scenes must preserve the language and
diacritics of the input context, script, and timeline.

For Vietnamese videos:

- Render Vietnamese with correct diacritics in every title, badge, chip, label,
  stamp, caption, UI mockup, chart label, and explanatory phrase.
- Do not romanize Vietnamese into ASCII-only text such as `khong`,
  `cau tra loi`, `nguon that`, or `ao giac`.
- Do not invent English UI labels unless the source context intentionally uses
  that term, the term is a brand/product/code name, or the narration explicitly
  keeps it as a foreign term.
- If an English term is useful, make it secondary to the Vietnamese label, for
  example `Ảo giác AI` as the primary text and `Hallucination` as a small
  supporting label.
- Unicode Vietnamese string literals are allowed in generated TSX scene code;
  this is required for language fidelity.
- Prefer deriving short visible labels from `audioSegment.text`, `plan.json`,
  `script.json`, or explicit spec fields before inventing new copy.

This contract applies to text hardcoded in scene components as well as text
listed in `spec.json`.

### Required diversity

- Every scene must have a distinct visual concept.
- No base scene component may render more than two scenes.
- Do not implement a single `GenericScene`/`WorkflowScene` whose props only replace text.
- Across the video, use at least three different motion patterns.
- Every body scene must visually explain its idea, not merely decorate text.
- Text-only scenes are allowed when typography is the visual concept.
- Intentional stillness is allowed when it improves comprehension or emphasis.

---

## Scene Transitions

Every scene boundary must use a deliberate transition chosen from the meaning,
direction, and energy of the adjacent scenes. Do not leave hard cuts unless the
spec explicitly explains why a hard cut is creatively necessary.

Use `TransitionSeries` and the presets exported from
`src/templates/creative/free-style`:

| Content relationship | Recommended preset |
|---|---|
| Calm continuation, reflective topic | `softFade()` |
| New step, timeline progression, forward motion | `energeticSlide(direction)` |
| Process, transformation, before/after | `directionalWipe(direction)` |
| Technical architecture, major perspective change | `technicalFlip(direction)` |

Rules:

- Each transition lasts `12–24` frames.
- Do not repeat one transition preset at every boundary.
- Direction should support the visual flow between scenes.
- Avoid transitions that compete with narration or obscure important content.
- Watermark and subtitles remain persistent above transitions.
- Scene enter/exit animation and boundary transition must complement each other.

### Duration handling — mandatory

`TransitionSeries` overlaps adjacent scenes, reducing total duration. The
template exports `addTransitionHandles()` to preserve audio-derived timing.

Given audio-derived durations `[240, 300, 210]` and transition durations
`[18, 20]`:

```ts
const sequenceDurations = addTransitionHandles(
  [SCENE1_DUR, SCENE2_DUR, SCENE3_DUR],
  [TRANSITION_1_DUR, TRANSITION_2_DUR],
);
// [258, 320, 210]
```

`TransitionSeries` then subtracts `18 + 20`, so the final duration remains:

```text
240 + 300 + 210 = 750 frames
```

---

## Icons And Third-Party Logos

- General interface/concept icons: use `lucide-react`.
- Brand and third-party product logos: use `react-icons/si`.
- Use `react-icons/fa`, `react-icons/md`, or another installed `react-icons` set only when no suitable Lucide/Simple Icon exists.
- Do not draw a third-party logo manually.
- Do not use emoji when a suitable library icon exists.
- Use official brand colors when brand recognition matters; otherwise adapt icons to the video palette.

Example:

```tsx
import {Github, Code2} from 'lucide-react';
import {SiOpenai, SiRemotion} from 'react-icons/si';
```

---

## Persistent Layout

Use `FreeStyleLayout` from `src/templates/creative/free-style`.

It always renders:

- `public/watermark.png` at `top: 7%`, height `90px`
- Subtitles above all scene content
- A configurable base background

The layout deliberately does not constrain scene backgrounds. Scene components may render full bleed, but meaningful content must respect:

```ts
FREE_STYLE_SAFE_AREA = {
  top: 250,
  bottom: 440,
  horizontal: 48,
}
```

### Safe-zone rules

- Do not place titles, badges, cards, icons, or diagrams above `250px`.
- Do not place meaningful content below `1480px` in 1080×1920 video.
- The bottom `440px` is reserved for subtitles and visual breathing room.
- Decorative full-bleed effects may enter safe zones because they do not carry information.
- Watermark and subtitles must remain readable in every scene.

---

## Step 6 Output

Create `videos/<slug>/spec.json`.

The spec is a creative brief for the Coder, not a fixed component schema:

```json
{
  "templateId": "creative/free-style",
  "slug": "<slug>",
  "totalFrames": 1800,
  "creativeDirection": {
    "concept": "One-sentence visual concept unique to this video",
    "tone": "energetic | cinematic | playful | technical | editorial | ...",
    "palette": {
      "background": "#...",
      "text": "#...",
      "accent": "#...",
      "accent2": "#..."
    },
    "motionLanguage": ["kinetic typography", "node graph", "filmstrip capture"],
    "transitionLanguage": "Transitions change based on the semantic relationship between scenes",
    "font": "BeVietnamPro | NotoSans | Mulish | Nunito | Lexend",
    "subtitleAccent": "#..."
  },
  "scenes": [
    {
      "type": "hook | body | ending",
      "startFrame": 0,
      "durationFrames": 240,
      "audioSegment": {
        "start": 0,
        "end": 8,
        "text": "Exact timeline text"
      },
      "visualConcept": "A unique visual metaphor for this scene",
      "coreIdea": "What viewers must understand",
      "dominantElement": "Primary visual focus",
      "layout": "Precise placement inside safe zones",
      "elements": ["Element and content list"],
      "visibleText": [
        "Exact Vietnamese text, with diacritics, intended to appear on screen"
      ],
      "informationOrder": ["First idea", "Second idea"],
      "animationBeats": [
        {"frames": "0-30", "action": "Background reveal"},
        {"frames": "20-75", "action": "Hero visual enters"}
      ],
      "motionIntent": "Why the scene moves or remains still",
      "safeAreaNotes": "Relevant watermark and subtitle constraints",
      "transitionToNext": {
        "preset": "energeticSlide",
        "direction": "from-right",
        "durationFrames": 18,
        "reason": "The narration advances into the next process step"
      },
      "iconPlan": [
        {"meaning": "GitHub", "library": "lucide-react", "icon": "Github"}
      ]
    }
  ]
}
```

### Timing

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract. When using
`TransitionSeries`, compensate for overlap with `addTransitionHandles()`.

### Spec quality checks

- Each `visualConcept` must differ from every other scene.
- Each scene satisfies `docs/gen-video/creative-quality-contract.md`.
- Animation beats follow the information order and scene purpose; no universal
  beat count or stagger interval is required.
- Text-only and intentionally still scenes explain why that treatment supports
  the narration.
- `iconPlan` names the real library and exported icon component.
- All meaningful elements are inside the safe area.
- `visibleText` and any rendered text preserve the source language and
  diacritics.
- Vietnamese scene text is not romanized into ASCII-only copy.
- Every non-final scene defines `transitionToNext`, including a creative reason.
- Transition durations are `12–24` frames.
- Transition presets and directions vary across the video.

---

## Step 7 Coder

Before coding, read:

- `docs/gen-video/creative-quality-contract.md`
- `docs/remotion-best-practices/SKILL.md`
- Rules for animations, timing, sequencing, text animations, fonts, and any APIs required by the spec

Then:

1. Delete stale generated files in `src/scenes/`.
2. Create `src/scenes/tokens.ts` from `creativeDirection`.
3. Create a distinct scene component for every scene in `spec.json`.
4. Shared helpers are allowed only for primitives such as glass cards, labels, easing, and background effects.
5. Do not create a shared component that dictates every scene's complete layout.
6. Compose scenes in `src/VideoContent.tsx` with `FreeStyleLayout`.
7. Use `TransitionSeries`, `freeStyleTransition`, and `addTransitionHandles`.
8. Update only `defaultSlug` and `defaultDuration` in `src/Root.tsx`.
9. Before verification, scan every viewer-facing string literal in
   `src/scenes/*.tsx` and replace English or ASCII-only Vietnamese copy with
   Vietnamese text that preserves diacritics, unless it is an intentional brand,
   product, code, or quoted foreign-language term.

### VideoContent.tsx pattern

```tsx
import React from 'react';
import {Audio, staticFile} from 'remotion';
import {TransitionSeries} from '@remotion/transitions';
import {
  addTransitionHandles,
  FreeStyleLayout,
  freeStyleTransition,
} from './templates/creative/free-style';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Body} from './scenes/Scene2Body';
import {Scene3Ending} from './scenes/Scene3Ending';
import {COLORS, SCENE1_DUR, SCENE2_DUR, SCENE3_DUR} from './scenes/tokens';

export const VideoContent: React.FC<{slug: string}> = ({slug}) => (
  <FreeStyleLayout
    slug={slug}
    background={COLORS.bg}
    subtitleAccent={COLORS.subtitleAccent}
  >
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sequenceDurations[0]} premountFor={30}>
        <Scene1Hook />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...transition1} />
      <TransitionSeries.Sequence durationInFrames={sequenceDurations[1]} premountFor={30}>
        <Scene2Body />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...transition2} />
      <TransitionSeries.Sequence durationInFrames={sequenceDurations[2]} premountFor={30}>
        <Scene3Ending />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </FreeStyleLayout>
);
```

Define transition presets and adjusted sequence durations above the component:

```tsx
const transition1 = freeStyleTransition.energeticSlide('from-right', 18);
const transition2 = freeStyleTransition.softFade(20);

const sequenceDurations = addTransitionHandles(
  [SCENE1_DUR, SCENE2_DUR, SCENE3_DUR],
  [
    transition1.timing.getDurationInFrames({fps: 30}),
    transition2.timing.getDurationInFrames({fps: 30}),
  ],
);
```

### Verification

Follow `docs/gen-video/verification.md`. Creative scenes require early, middle,
and late frame inspection. Fix weak scenes and collisions before final render.

---

## Final Checklist

- [ ] `templateId` is `creative/free-style`
- [ ] Watermark uses `public/watermark.png`
- [ ] `FreeStyleLayout` wraps the full video
- [ ] Every scene has a unique visual concept and distinct composition
- [ ] No generic full-scene component is reused across the video
- [ ] At least three different animation patterns are used
- [ ] Every scene passes the creative quality gate
- [ ] Every scene boundary has a content-driven transition or documented intentional hard cut
- [ ] Transition presets/directions are not repeated mechanically
- [ ] Transition handles preserve the exact audio-derived total duration
- [ ] Third-party logos/icons use installed libraries
- [ ] Meaningful content respects top and bottom safe zones
- [ ] Subtitle and watermark do not overlap content
- [ ] Scene durations sum exactly to `totalFrames`
- [ ] Viewer-facing scene text preserves the source language and Vietnamese
      diacritics
