# Template Spec Rules: creative/source-led

Read this document before Step 2, Step 6, and Step 7 when any
`creative/source-led-*` template is selected.

## Identity

This family creates content-led creative videos supported by real evidence from
one supplied public article or content URL.

It is not a fixed news slideshow:

- Article text is the factual context for Planner and Teller.
- Relevant article images and muted video excerpts may support individual scenes.
- Evidence appears inside a content-specific creative composition.
- A scene without sufficiently relevant evidence becomes a normal free-style
  scene. Missing media never forces a weak or misleading match.
- Attribution remains visible whenever source media is visible.

The family inherits scene diversity, transitions, safe zones, watermark,
subtitles, language fidelity, and creative quality rules from
[`creative/free-style`](free-style.md).

## Variants

| Template ID | Visual mode | Audio mode |
|---|---|---|
| `creative/source-led-light` | light editorial | voiceover only |
| `creative/source-led-dark` | dark editorial/cinematic | voiceover only |
| `creative/source-led-light-sfx` | light editorial | background music + scene-entry SFX |
| `creative/source-led-dark-sfx` | dark editorial/cinematic | background music + scene-entry SFX |

The non-SFX variants set `video.bgMusic` to `null`, set `audioDesign.mode` to
`silent`, and render no transition SFX. "Silent" means no extra sound design;
voiceover remains present.

The SFX variants follow all audio rules from
[`creative/free-style-sfx`](free-style-sfx.md).

## Required Input And Acquisition

The context must contain exactly one primary public `http` or `https` page URL.
Extra user instructions may accompany the URL. A direct image, MP4, playlist, or
private/local URL does not satisfy this contract.

Immediately after Step 1, before Planner or TTS, run:

```bash
node scripts/source-evidence.mjs "<page-url>" "<slug>"
```

Successful acquisition creates:

```text
videos/<slug>/source-context.txt
public/<slug>/source-evidence.json
public/<slug>/evidence/image-*.*
```

`source-context.txt` contains the extracted title, description, source identity,
URL, and article text. Use it as the primary Planner input. Preserve explicit
instructions from the original `context.txt`.

`source-evidence.json` contains article metadata and zero or more evidence
assets. Zero usable assets is a valid result. Continue the pipeline and generate
all scenes using free-style creative direction.

Acquisition must fail only when the URL is invalid, unsafe, inaccessible, or not
an HTML content page. It must not fail merely because no image or video survives
filtering.

The initial acquisition implementation supports normal article images and
directly discoverable/probeable video files or playlists. It does not download
from protected social/video iframe players such as YouTube, TikTok, Facebook, or
Instagram. If such a player exposes no usable direct media, treat that scene as
having no video evidence; a separately discovered article image may still be
used.

## Evidence Manifest Contract

The generated manifest has this shape:

```json
{
  "version": 1,
  "article": {
    "url": "https://publisher.example/story",
    "title": "Original title",
    "description": "Original description",
    "publishedAt": "2026-06-21T08:00:00Z",
    "creator": "Original author",
    "publisher": "Publisher",
    "credit": "Nguồn: Original author · Publisher",
    "text": "Extracted article text"
  },
  "assets": [
    {
      "id": "image-01",
      "kind": "image",
      "src": "<slug>/evidence/image-01.jpg",
      "storage": "local",
      "sourcePageUrl": "https://publisher.example/story",
      "sourceMediaUrl": "https://cdn.example/photo.jpg",
      "credit": "Nguồn: Original author · Publisher",
      "caption": "Original caption",
      "alt": "Original alt text",
      "nearbyText": "Article text surrounding the media",
      "width": 1600,
      "height": 900
    }
  ],
  "stats": {
    "imageCount": 1,
    "videoCount": 0,
    "usableAssetCount": 1
  }
}
```

Downloaded media does not remove attribution or imply permission. Never invent
a license, copyright owner, permission claim, or `©` notice. Preserve explicit
credit supplied by the page when available.

## Planner And Teller

Planner reads:

- `videos/<slug>/context.txt` for the user's framing and instructions.
- `videos/<slug>/source-context.txt` for factual article context.
- `public/<slug>/source-evidence.json` for potential evidence.

Use the normal duration and segment-count rules from the common pipeline.
Do not write narration about an image or video merely because the asset exists.
The story comes first.

For each planned segment, note whether the manifest contains a potentially
relevant asset. This is a planning hint, not a mandatory assignment.

Teller remains narration-led. Do not add phrases such as "as you can see in this
photo" unless the source itself makes that observation important.

## Evidence Selection

Select evidence independently for every scene. A valid match should be supported
by at least one strong signal:

- Caption or alt text directly matches the scene subject.
- Nearby article text contains the same event, person, place, object, or action.
- The asset is explicitly identified as evidence for the claim being narrated.
- A video contains a known relevant interval that can be shown without changing
  its meaning.

Do not use:

- Logos, avatars, navigation graphics, advertisements, tracking pixels, or icons.
- Generic hero media whose relationship to the scene is unclear.
- A person/place/object as evidence for a different person/place/object.
- An arbitrary video interval selected only to create movement.
- The same asset in several scenes unless each reuse has a distinct explanatory
  purpose.

When confidence is insufficient, set `evidence` to `null` and
`fallbackToFreeStyle` to `true`.

## Media Playback

Images:

- Use Remotion `<Img>`.
- Prefer local paths written by acquisition.
- Choose `cover` only when important content will not be cropped.
- Use restrained, deterministic Ken Burns motion when it supports attention.

Videos:

- Use `<Video>` from `@remotion/media`.
- Always set `muted` and `volume={0}`.
- Use `clipStartSeconds` and `clipEndSeconds` to select only the relevant
  interval.
- Never add source-video audio, even in non-SFX variants.
- Never loop an evidence clip merely to fill the scene.
- If the relevant interval is shorter than the scene, show it for one deliberate
  beat, hold a meaningful frame, or transition to free-style explanation.
- Do not alter playback speed when doing so could change the perceived meaning.

Remote URLs must not be passed through `staticFile()`. Components exported from
`src/templates/creative/source-led` resolve local and remote sources correctly.

## Attribution

Attribution is mandatory for the entire time evidence media is visible.

Show:

- `NGUỒN · <article hostname>`
- `credit` from the manifest
- Original caption when it is useful and readable

Keep attribution visually attached to the evidence frame. Do not hide it behind
subtitles, watermark, a crop, or a transition. Do not display an unwieldy full
URL on screen; preserve full URLs in the manifest and spec.

## Step 6 Spec

Create `videos/<slug>/spec.json`:

```json
{
  "templateId": "creative/source-led-dark",
  "slug": "<slug>",
  "totalFrames": 1800,
  "video": {
    "title": "Vietnamese title",
    "date": "YYYY-MM-DD",
    "bgMusic": null
  },
  "source": {
    "articleUrl": "https://publisher.example/story",
    "evidenceManifest": "<slug>/source-evidence.json",
    "usableAssetCount": 3
  },
  "creativeDirection": {
    "mode": "dark",
    "concept": "A content-specific source-led visual concept",
    "tone": "editorial",
    "palette": {
      "background": "#05070D",
      "text": "#F8FAFC",
      "accent": "#50E3C2",
      "accent2": "#8B5CF6"
    },
    "motionLanguage": ["evidence reveal", "kinetic typography", "diagram"],
    "transitionLanguage": "Transitions connect source artifacts to explanation",
    "font": "BeVietnamPro",
    "subtitleAccent": "#50E3C2"
  },
  "audioDesign": {
    "mode": "silent",
    "sfxPalette": [],
    "sfxRules": "Voiceover only. Source video is always muted."
  },
  "evidenceAssets": [],
  "scenes": [
    {
      "type": "body",
      "startFrame": 240,
      "durationFrames": 300,
      "audioSegment": {"start": 8, "end": 18, "text": "..."},
      "evidence": {
        "assetId": "video-01",
        "relevanceReason": "Caption and nearby text identify the same event",
        "clipStartSeconds": 12.5,
        "clipEndSeconds": 18.5,
        "fit": "contain",
        "presentation": "framed"
      },
      "fallbackToFreeStyle": false,
      "visibleText": ["Dẫn chứng từ hiện trường"],
      "visualConcept": "The source clip appears as an evidence artifact while a diagram explains the consequence",
      "coreIdea": "What viewers must understand",
      "dominantElement": "Muted source clip",
      "informationOrder": ["Claim", "Evidence", "Explanation"],
      "motionIntent": "Reveal evidence only when narration reaches the supported claim",
      "safeAreaNotes": "Attribution remains above the subtitle zone"
    },
    {
      "type": "ending",
      "startFrame": 1500,
      "durationFrames": 300,
      "audioSegment": {"start": 50, "end": 58, "text": "..."},
      "evidence": null,
      "fallbackToFreeStyle": true,
      "visibleText": ["Điều cần nhớ"],
      "visualConcept": "A content-specific free-style conclusion",
      "coreIdea": "Closing idea",
      "dominantElement": "Kinetic closing statement",
      "informationOrder": ["Conclusion"],
      "motionIntent": "Settle into a readable final hold",
      "safeAreaNotes": "Keep the conclusion above subtitles"
    }
  ]
}
```

Copy only assets selected by at least one scene into `evidenceAssets`. Every
`assetId` must resolve to exactly one copied manifest asset.

For video selections:

- `0 <= clipStartSeconds < clipEndSeconds <= asset.duration`
- The interval should be close to the scene duration, or the scene brief must
  explain the handoff from media to graphics.

Timing follows the common timing contract. Transition handles remain mandatory.

## Audio Rules

For `creative/source-led-light` and `creative/source-led-dark`:

- `video.bgMusic` is `null`.
- `audioDesign.mode` is `silent`.
- Every scene omits `entrySfx`.
- Use `FreeStyleLayout`.

For `creative/source-led-light-sfx` and
`creative/source-led-dark-sfx`:

- Set `video.bgMusic` to this template's configured `defaultBgMusic` in
  `src/templates/registry.ts`.
- Do not choose a track by story mood.
- `audioDesign.mode` is `sfx`.
- Every scene has exactly one `entrySfx`.
- Use only `whoosh`, `whip`, or `pageTurn`.
- Use `FreeStyleSfxLayout` and shared SFX helpers.

Source video remains muted in all four variants.

## Step 7 Coder

Before coding, read:

- `docs/templates/creative/free-style.md`
- `docs/templates/creative/free-style-sfx.md` only for SFX variants
- `docs/gen-video/creative-quality-contract.md`
- `docs/remotion-best-practices/SKILL.md`
- rules for images, videos, transitions, sequencing, timing, and SFX when needed

Then:

1. Build distinct content-specific scene components as required by free-style.
2. For selected evidence, use `SourceEvidenceScene` or its media primitives from
   `src/templates/creative/source-led`.
3. Do not force every evidence scene into the same complete composition. The
   shared component is a reliable baseline for media, clipping, and attribution;
   content-specific diagrams and typography should still vary.
4. For fallback scenes, implement normal free-style scenes without placeholder
   media or empty evidence frames.
5. Wrap the video with `FreeStyleLayout` or `FreeStyleSfxLayout` according to the
   variant.
6. Keep the normal voiceover and subtitle overlays.
7. Verify evidence at early, middle, and late frames. For a video interval,
   inspect at least two frames inside the selected clip.

## Final Checklist

- [ ] Input contains a public HTML page URL
- [ ] Acquisition ran before Planner
- [ ] Planner used extracted source context
- [ ] Missing media did not stop generation
- [ ] Every evidence assignment has a written relevance reason
- [ ] Weak matches fall back per scene to free-style
- [ ] Every source video is muted and shows only a relevant interval
- [ ] Attribution remains visible whenever evidence is visible
- [ ] Full source and media URLs remain in JSON metadata
- [ ] Light/dark mode matches the selected template ID
- [ ] Audio mode matches the selected template ID
- [ ] Free-style diversity, safe zones, transitions, subtitles, and watermark
      rules are satisfied
