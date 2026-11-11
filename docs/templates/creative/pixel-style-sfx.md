# Template Spec Rules: creative/pixel-style-sfx

Read this document before Step 6 (Spec) and Step 7 (Coder) when
`creative/pixel-style-sfx` is selected.

---

## Purpose

This is the audio-enhanced version of `creative/pixel-style`.

Read these documents first:

- `docs/templates/creative/pixel-style.md`
- `docs/templates/creative/free-style-sfx.md`
- `docs/gen-video/creative-quality-contract.md`

All pixel visual, typography, safe-zone, motion, transition, language fidelity,
and verification rules from `creative/pixel-style` remain mandatory.

All audio rules from `creative/free-style-sfx` remain mandatory:

- background music copied from this template's configured `defaultBgMusic` in
  `src/templates/registry.ts`
- exactly one scene-entry transition SFX for every scene, including the first
- only `whoosh`, `whip`, or `pageTurn`
- no interaction, impact, meme, confirmation, or error SFX

Pixel visuals do not authorize arcade bleeps on every animation.

---

## Step 6 Output

Use the `creative/pixel-style` spec schema, plus the audio fields from
`creative/free-style-sfx`:

```json
{
  "templateId": "creative/pixel-style-sfx",
  "video": {
    "title": "Tiêu đề tiếng Việt",
    "date": "YYYY-MM-DD",
    "bgMusic": "assets/news/music/the_mountain-news-news-music.mp3"
  },
  "audioDesign": {
    "sfxPalette": [
      {
        "name": "whoosh",
        "reason": "Chuyển sang bảng thông tin mới"
      },
      {
        "name": "whip",
        "reason": "Chuyển cảnh nhanh ở điểm nhấn"
      }
    ],
    "sfxRules": "Mỗi cảnh có đúng một entrySfx dùng cho thời điểm cảnh bắt đầu."
  },
  "creativeDirection": {
    "concept": "A content-specific modern pixel-editorial concept",
    "displayFont": "Handjet",
    "terminalFont": "VT323",
    "bodyFont": "Be Vietnam Pro"
  },
  "scenes": [
    {
      "startFrame": 0,
      "entrySfx": {
        "name": "whoosh",
        "volume": 0.18,
        "reason": "Mở đầu video bằng chuyển cảnh nhẹ"
      }
    }
  ]
}
```

`video.bgMusic` must match this template's configured `defaultBgMusic`. Every
scene must contain exactly one `entrySfx`.

---

## Step 7 Coder

Follow the coder workflow from `creative/pixel-style`, with these changes:

1. Compose with `PixelStyleSfxLayout`.
2. Pass `bgMusic={spec.video.bgMusic}`.
3. Import `TRANSITION_SFX`, `MAX_TRANSITION_SFX_VOLUME`, and
   `TransitionSfxName` from `src/templates/creative/pixel-style-sfx`.
4. Render one entry SFX at each scene's `startFrame`.
5. Cap runtime SFX volume at `MAX_TRANSITION_SFX_VOLUME`.
6. Do not attach sound to text reveals, counters, sprite movement, alerts, UI
   interactions, or pixel transitions themselves.

### Composition import pattern

```tsx
import {
  addTransitionHandles,
  MAX_TRANSITION_SFX_VOLUME,
  PixelStyleSfxLayout,
  pixelStyleTransition,
  TRANSITION_SFX,
} from "./templates/creative/pixel-style-sfx";
```

Background music uses the selected `manifest.music[].volume`, falling back to
`0.1` when the field is missing. SFX volume rules remain:

- `whoosh`: `0.18`
- `whip`: `0.15`
- `pageTurn`: `0.20`
- custom volume: `0.15–0.22`
- runtime cap: `0.25`

---

## Final Checklist

- [ ] `templateId` is `creative/pixel-style-sfx`
- [ ] All `creative/pixel-style` visual checks pass
- [ ] `PixelStyleSfxLayout` wraps the full video
- [ ] `video.bgMusic` points to the creative asset manifest
- [ ] Background music volume comes from the selected manifest entry
- [ ] Every scene, including the first, has exactly one entry SFX
- [ ] Only `whoosh`, `whip`, or `pageTurn` is used
- [ ] No non-transition SFX is present
- [ ] Runtime SFX volume does not exceed `0.25`
