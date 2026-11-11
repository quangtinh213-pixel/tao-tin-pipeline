# Template Spec Rules: creative/pixel-style

Read this document before Step 6 (Spec) and Step 7 (Coder) when
`creative/pixel-style` is selected.

---

## Purpose

This is a creative-direction template derived from `creative/free-style`.
Every generation creates content-specific scenes, while preserving a recognizable
modern pixel-editorial visual language.

Read these documents first:

- `docs/templates/creative/free-style.md`
- `docs/gen-video/creative-quality-contract.md`

All timing, language fidelity, icon sourcing, scene diversity, safe-zone, and
verification rules from `creative/free-style` remain mandatory. This document
adds the pixel design contract and replaces its layout and transition imports.

The target is editorial motion design built from pixel geometry. Do not default
to a generic retro-game interface, arcade parody, or the same RPG card layout in
every scene.

---

## Pixel Design Contract

### Typography

Use the exported font constants from `src/templates/creative/pixel-style`:

- `PIXEL_FONT_DISPLAY` — Handjet, weights 400/700/900, for headlines, numbers,
  badges, and short labels.
- `PIXEL_FONT_TERMINAL` — VT323, weight 400, for dialogue, terminal, logs, and
  compact annotations.
- `PIXEL_FONT_BODY` — Be Vietnam Pro, weights 400/700, for longer explanatory
  copy and dense labels.

All three font loads include the Vietnamese subset. Never replace Vietnamese
text with ASCII-only text. Use precomposed Unicode Vietnamese strings when
hardcoding scene copy.

Handjet and VT323 are display faces. Use `PIXEL_FONT_BODY` when a phrase becomes
hard to scan, contains more than roughly two short lines, or is smaller than
32px.

### Geometry

- Base spacing unit: `PIXEL_UNIT = 4`.
- Sizes, gaps, offsets, and borders should normally be multiples of 4px.
- Prefer hard rectangular silhouettes and stepped corners.
- Borders should normally be 4px or 8px.
- Shadows are hard offset shadows. Do not use feathered box shadows.
- Do not use glassmorphism, backdrop blur, soft glow cards, or pill-heavy UI.
- Rounded corners are forbidden unless the scene depicts a real product or
  object whose form requires them.

### Image treatment

Use `PixelImage` or set `imageRendering: "pixelated"` for intentionally
pixelated imagery. Photos may remain recognizable, but should be integrated
with one content-relevant treatment such as:

- stepped crop or tiled reveal
- limited-color overlay
- ordered-dither mask
- hard pixel frame
- magnified detail blocks

Do not degrade every photo until the subject becomes unclear.

### Palette

The exported `PIXEL_STYLE_COLORS` is the default palette, not a mandatory palette
for every story. A generated video may choose another palette, provided it keeps:

- one dark or light base
- one readable foreground
- one main accent
- no more than two supporting semantic accents
- strong contrast without soft neon haze

### Motion language

Motion should feel stepped, grid-aware, and deliberate:

- quantize positions or scales into visible steps when appropriate
- reveal text by word, glyph block, or line rather than CSS typing animation
- build charts, maps, and diagrams tile by tile
- use counters, sprite-like movement, pixel masks, and discrete zoom levels
- allow still holds after dense reveals

All animation must use Remotion frames. CSS transitions and CSS keyframe
animations are forbidden.

Across the video, use at least three different pixel-native motion patterns.
Glitch is an accent, not the default motion language.

### Scene concepts

Possible scene metaphors include `quest hook`, `pixel map`, `inventory`,
`comparison battle`, `stat screen`, `dialogue box`, `system alert`, and
`level complete`. These are optional creative prompts, not fixed schemas.

Do not use one complete scene composition more than twice.

---

## Persistent Layout

Use `PixelStyleLayout` from `src/templates/creative/pixel-style`.

It preserves the `FreeStyleLayout` watermark and subtitle behavior, and adds:

- optional 32px pixel grid
- optional static scanline texture
- Be Vietnam Pro as the safe default body font
- default pixel-editorial palette

Meaningful content must respect `PIXEL_STYLE_SAFE_AREA`, which matches the
free-style safe area:

```ts
{
  top: 250,
  bottom: 440,
  horizontal: 48
}
```

Grid and scanlines are decorative. Disable either when it reduces contrast or
fights the scene concept.

Use the exported primitives only as building blocks:

- `PixelFrame`
- `PixelText`
- `PixelBadge`
- `PixelImage`

They must not become a generic full-scene renderer.

---

## Scene Transitions

Use `TransitionSeries`, `pixelStyleTransition`, and `addTransitionHandles`.

| Content relationship | Preset |
|---|---|
| Quiet continuation or soft reveal | `pixelDissolve()` |
| New panel, transformation, before/after | `tileWipe(direction)` |
| Progression, map movement, next step | `screenScroll(direction)` |
| Abrupt warning or major perspective switch | `glitchCut(direction)` |

Rules:

- Transition duration must be 12–24 frames.
- Prefer durations divisible by 2 or 4.
- Do not use `glitchCut` at every boundary.
- Vary preset or direction according to the story.
- Use `addTransitionHandles()` to preserve audio-derived total duration.

---

## Step 6 Output

Create `videos/<slug>/spec.json` using the creative schema from
`creative/free-style`, with:

```json
{
  "templateId": "creative/pixel-style",
  "creativeDirection": {
    "concept": "A content-specific modern pixel-editorial concept",
    "tone": "playful | technical | urgent | reflective | editorial",
    "palette": {
      "background": "#101018",
      "surface": "#202038",
      "text": "#FFF8D6",
      "accent": "#45D9FF",
      "accent2": "#59F176"
    },
    "motionLanguage": [
      "stepped kinetic typography",
      "tile-built diagram",
      "discrete pixel zoom"
    ],
    "transitionLanguage": "Pixel transitions follow semantic scene changes",
    "displayFont": "Handjet",
    "terminalFont": "VT323",
    "bodyFont": "Be Vietnam Pro",
    "subtitleAccent": "#FFD166"
  }
}
```

Each scene must also explain its pixel treatment:

```json
{
  "pixelTreatment": {
    "geometry": "How the 4px grid shapes the composition",
    "imageTreatment": "none | pixelated | tiled reveal | dithered | hard frame",
    "motionPattern": "The pixel-native motion used in this scene"
  }
}
```

The rest of each scene follows the `creative/free-style` schema, including
`coreIdea`, `visualConcept`, `dominantElement`, `informationOrder`,
`animationBeats`, `motionIntent`, `safeAreaNotes`, and `transitionToNext`.

---

## Step 7 Coder

1. Follow the creative coder workflow from `creative/free-style`.
2. Import layout, primitives, fonts, colors, transitions, and timing helpers
   from `src/templates/creative/pixel-style`.
3. Create a distinct scene component for each scene.
4. Use Handjet or VT323 only where display typography remains readable.
5. Drive stepped motion from `useCurrentFrame()`. A useful technique is to
   quantize a frame-derived value before rendering it.
6. Compose scenes with `PixelStyleLayout`.
7. Use `pixelStyleTransition` and `addTransitionHandles`.
8. Verify Vietnamese glyphs with representative words containing `ă â đ ê ô
   ơ ư` and tone marks.

### Composition import pattern

```tsx
import {
  addTransitionHandles,
  PixelStyleLayout,
  pixelStyleTransition,
  PIXEL_STYLE_COLORS,
} from './templates/creative/pixel-style';
```

---

## Final Checklist

- [ ] `templateId` is `creative/pixel-style`
- [ ] `PixelStyleLayout` wraps the full video
- [ ] Handjet and VT323 are used only for readable display-sized text
- [ ] Longer copy uses Be Vietnam Pro
- [ ] Viewer-facing Vietnamese preserves all diacritics
- [ ] Geometry follows the 4px grid unless the scene documents an exception
- [ ] No glass blur, soft card shadow, or generic rounded-card system
- [ ] At least three pixel-native motion patterns appear across the video
- [ ] Glitch is used sparingly
- [ ] Scenes remain content-specific and visually diverse
- [ ] Transition overlap is compensated with `addTransitionHandles`
- [ ] Watermark and subtitle safe zones remain clear
