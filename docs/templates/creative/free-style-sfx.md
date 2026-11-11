# Template Spec Rules: creative/free-style-sfx

Read this document before Step 6 (Spec) and Step 7 (Coder) when
`creative/free-style-sfx` is selected.

---

## Purpose

This template is the audio-enhanced version of `creative/free-style`.

It keeps the same creative freedom and visual quality bar, but additionally
requires:

- One background music track from `public/assets/creative/manifest.json`
- One scene-entry transition sound for every scene, including the opening scene

Read `docs/templates/creative/free-style.md` first for the visual system,
safe-zone rules, transition rules, and creative quality expectations. This
document overrides only the audio/SFX parts and the import pattern.

Also read `docs/gen-video/creative-quality-contract.md` before creating the
spec or custom scenes.

---

## Audio Direction

### Background Music

Set `video.bgMusic` to this template's configured `defaultBgMusic` in
`src/templates/registry.ts`. Do not choose a track by story mood.

Rules:

- Do not set `video.bgMusic` to `null` unless the user explicitly asks for no
  music.
- The layout renders background music with loop at the selected
  `manifest.music[].volume`.
- If a manifest entry has no `volume`, runtime falls back to `0.1`.

### Sound Effects

Use only the curated transition SFX URLs exported by
`src/templates/creative/free-style-sfx` as `TRANSITION_SFX`.

Available names:

| SFX name | Use for |
|---|---|
| `whoosh` | Smooth or energetic scene entry |
| `whip` | Sharp, fast scene change |
| `pageTurn` | Scene change involving documents, reports, articles, or chapters |

Rules:

- Every scene must define exactly one `entrySfx`, including the first scene.
- Play `entrySfx` at that scene's `startFrame`.
- Use only `whoosh`, `whip`, or `pageTurn`.
- Default volumes: `whoosh = 0.18`, `whip = 0.15`, and
  `pageTurn = 0.20`.
- Custom volume may be used from `0.15-0.22` when the transition needs tuning.
  Runtime volume is capped at `0.25`.
- Do not create `sfxEvents` inside a scene.
- Do not attach SFX to UI interactions, reveals, text animation, impacts,
  confirmations, errors, or other non-transition moments.

---

## Step 6 Output

Create `videos/<slug>/spec.json`.

Use the same creative scene schema as `creative/free-style`, plus `video.bgMusic`
and `audioDesign`.

```json
{
  "templateId": "creative/free-style-sfx",
  "slug": "<slug>",
  "totalFrames": 1800,
  "video": {
    "title": "Vietnamese title",
    "date": "YYYY-MM-DD",
    "bgMusic": "assets/news/music/sonican-tech-news-information.mp3"
  },
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
  "audioDesign": {
    "sfxPalette": [
      {"name": "whoosh", "reason": "Fast data-flow transitions"},
      {"name": "whip", "reason": "Sharp high-energy scene changes"},
      {"name": "pageTurn", "reason": "Document and report scene changes"}
    ],
    "sfxRules": "Every scene has one entrySfx selected from whoosh, whip, or pageTurn."
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
      "entrySfx": {
        "name": "whoosh",
        "volume": 0.18,
        "reason": "Introduces the opening scene with a smooth transition"
      },
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

### Spec quality checks

- `templateId` is exactly `creative/free-style-sfx`.
- `video.bgMusic` is a path from `public/assets/creative/manifest.json`.
- `audioDesign.sfxPalette` contains only names from the transition SFX whitelist.
- Every scene has exactly one `entrySfx`, including the first scene.
- Every `entrySfx.name` exists in `audioDesign.sfxPalette`.
- There are no `sfxEvents` and no SFX attached to `transitionToNext`.
- Visual scene rules from `creative/free-style` still apply.
- All viewer-facing text follows the visible language contract in
  `creative/free-style`.

---

## Step 7 Coder

Before coding, read:

- `docs/templates/creative/free-style.md`
- `docs/gen-video/creative-quality-contract.md`
- `docs/remotion-best-practices/SKILL.md`
- `docs/remotion-best-practices/rules/audio.md`
- `docs/remotion-best-practices/rules/sfx.md`
- Any other Remotion rule files required by the selected visual design

Then follow the same Coder workflow as `creative/free-style`, with these changes:

1. Compose scenes in `src/VideoContent.tsx` with `FreeStyleSfxLayout`.
2. Pass `bgMusic={spec.video.bgMusic}` to `FreeStyleSfxLayout`.
3. Use normal Remotion `<Audio>` for voiceover.
4. Render each scene's `entrySfx` at that scene's `startFrame` using
   `TRANSITION_SFX`.
5. Enforce the `creative/free-style` visible language contract for every
   hardcoded scene string.

### VideoContent.tsx pattern

```tsx
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries} from '@remotion/transitions';
import {
  addTransitionHandles,
  FreeStyleSfxLayout,
  TRANSITION_SFX,
  freeStyleTransition,
} from './templates/creative/free-style-sfx';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Body} from './scenes/Scene2Body';
import {Scene3Ending} from './scenes/Scene3Ending';
import {
  COLORS,
  SCENE1_DUR,
  SCENE2_DUR,
  SCENE3_DUR,
  SCENE_ENTRY_SFX,
} from './scenes/tokens';
import specData from '../videos/<slug>/spec.json';

const spec = specData as {
  video: {bgMusic: string};
};

const transition1 = freeStyleTransition.energeticSlide('from-right', 18);
const transition2 = freeStyleTransition.softFade(20);

const sequenceDurations = addTransitionHandles(
  [SCENE1_DUR, SCENE2_DUR, SCENE3_DUR],
  [
    transition1.timing.getDurationInFrames({fps: 30}),
    transition2.timing.getDurationInFrames({fps: 30}),
  ],
);

export const VideoContent: React.FC<{slug: string}> = ({slug}) => (
  <FreeStyleSfxLayout
    slug={slug}
    background={COLORS.bg}
    subtitleAccent={COLORS.subtitleAccent}
    bgMusic={spec.video.bgMusic}
  >
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    {SCENE_ENTRY_SFX.map((event) => (
      <Sequence key={`${event.name}-${event.frame}`} from={event.frame} durationInFrames={90}>
        <Audio src={TRANSITION_SFX[event.name]} volume={Math.min(event.volume, 0.25)} />
      </Sequence>
    ))}
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
  </FreeStyleSfxLayout>
);
```

### Scene-entry SFX token pattern

Store scene-entry transition SFX in `src/scenes/tokens.ts`:

```ts
import type {TransitionSfxName} from '../templates/creative/free-style-sfx';

export const SCENE_ENTRY_SFX: Array<{
  frame: number;
  name: TransitionSfxName;
  volume: number;
}> = [
  {frame: 0, name: 'whoosh', volume: 0.18},
  {frame: 258, name: 'whip', volume: 0.15},
  {frame: 1590, name: 'pageTurn', volume: 0.20},
];
```

The array must contain one event per scene at the scene's `startFrame`.

---

## Final Checklist

- [ ] `templateId` is `creative/free-style-sfx`
- [ ] `video.bgMusic` is present and points to manifest music
- [ ] `FreeStyleSfxLayout` wraps the full video
- [ ] Voiceover remains full-volume unless there is a deliberate reason
- [ ] Background music volume comes from the selected manifest entry
- [ ] Every scene, including the first, has exactly one entry transition SFX
- [ ] SFX uses only `TRANSITION_SFX`
- [ ] SFX uses the per-sound defaults or a custom volume in `0.15-0.22`
- [ ] Runtime SFX volume is capped at `0.25`
- [ ] No non-transition SFX events are rendered
- [ ] Viewer-facing scene text preserves the source language and Vietnamese
      diacritics
- [ ] All `creative/free-style` visual, transition, safe-zone, and verification
      rules are satisfied
