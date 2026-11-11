# Template Spec Rules: news/modern-news-canvas

Read this document before Step 2, Step 6, and Step 7 when
`--template news/modern-news-canvas` is selected.

This is a **fixed, source-media-first modern news gallery**. It uses a bright
editorial canvas, orange accents, a compact news header, and a dominant media
viewport. The audience comes to see the source images and videos, so moving
media keeps a large viewport comparable to `news/media-showcase`; the recovered
space is used for compact editorial framing and static metadata.

The source images and videos extracted from the supplied URL are the main
content. Do not replace them with stock media, AI media, charts, decorative
graphics, or generic illustrations.

## Required URL And Acquisition

The context must contain exactly one primary public `http` or `https` article
or content-page URL. Immediately after Step 1, before Planner or TTS, run:

```bash
node scripts/source-evidence.mjs "<page-url>" "<slug>"
```

Use `videos/<slug>/source-context.txt` as the primary factual input and
`public/<slug>/source-evidence.json` as the only source of visible media. Stop
before Planner/TTS when `stats.usableAssetCount` is zero.

## Media Selection

- Use every relevant usable source image or video when practical.
- Preserve narrative order and exclude duplicates, logos, avatars, ads, icons,
  and unrelated media.
- Each scene contains 1-3 media items. Multiple items rotate full-frame inside
  the same dominant viewport; never split them into small tiles.
- Cycle selected assets in source order only when needed to cover narration.
- Keep video muted with `volume={0}` and loop short selected intervals.
- Prefer `cover` for landscape media when cropping remains truthful.
- Use `contain` for portrait media, screenshots, infographics, and sensitive
  framing. Portrait images may use a blurred copy of themselves as backdrop.
- Never place labels, text, badges, or generated content over source media.

## Planner And Teller

Plan 4-8 concise narration segments based on article length and usable media.
Each segment needs a factual, scene-specific headline of no more than two short
lines. The narration explains the article without repeatedly saying “trong ảnh”
or “trong video”.

## Step 6 Spec

```json
{
  "templateId": "news/modern-news-canvas",
  "slug": "<slug>",
  "totalFrames": 1200,
  "video": {
    "date": "17.06.2026",
    "bgMusic": "assets/news/music/nastelbom-soft-music.mp3"
  },
  "source": {
    "articleUrl": "https://publisher.example/article",
    "publisher": "Publisher",
    "evidenceManifest": "<slug>/source-evidence.json"
  },
  "mediaAssets": [
    {
      "id": "image-01",
      "kind": "image",
      "src": "<slug>/evidence/image-01.jpg",
      "storage": "local",
      "sourcePageUrl": "https://publisher.example/article",
      "sourceMediaUrl": "https://cdn.example/image.jpg",
      "credit": "Nguồn: Publisher",
      "width": 1600,
      "height": 900
    }
  ],
  "scenes": [
    {
      "startFrame": 0,
      "durationFrames": 240,
      "headline": "Tiêu đề ngắn của phân đoạn",
      "audioSegment": {"start": 0, "end": 8, "text": "..."},
      "media": [{"assetId": "image-01", "fit": "cover"}]
    }
  ]
}
```

Rules:

- Every `scene.media[].assetId` resolves to exactly one `mediaAssets[]` item.
- Every scene contains at least one media item.
- `scene.headline` is factual, scene-specific, and normally under 72 Vietnamese
  characters.
- `video.date` and `source.publisher` remain unchanged throughout the video.
- Scene timing is audio-derived and sums to `totalFrames`.
- Background music comes from `public/assets/news/manifest.json`; prefer a
  restrained track such as `nastelbom-soft-music.mp3`.

## Step 7 Coder

Use the fixed components in:

```text
src/templates/news/modern-news-canvas/
```

1. Import `Layout`, `ModernNewsCanvasScene`, and `ModernNewsCanvasSpec`.
2. Resolve every selected asset from `spec.mediaAssets`.
3. Render scenes with `<Series>` and normal voiceover `<Audio>`.
4. Pass publisher once to persistent `Layout`.
5. Pass publisher, date, scene headline, resolved media, and duration to each
   `ModernNewsCanvasScene`.
6. Keep production subtitles enabled and template-dev subtitles disabled.
7. Lock subtitle active-word color to orange `#F0642B`.
8. Do not change the fixed layout, palette, or media-to-metadata hierarchy per
   story.

## Visual Contract

- 1080x1920, 9:16, bright theme.
- Header label is exactly `TIN TỨC`; there is no slide counter.
- Background is warm white-gray, primary text is charcoal, and the main accent
  is modern orange.
- The media viewport is approximately 1048px tall, comparable to
  `news/media-showcase`, and remains the largest element.
- Publisher, source, and publication date are compact supporting metadata.
- Headline is scene-specific, left aligned, and limited to two short lines.
- Media transitions use push-slide plus clip-like reveal and fade. Images use a
  restrained Ken Burns move.
- No thumbnails, ticker, large date block, red rail, or broadcaster branding.
- Source attribution remains visible outside the viewport.

## Checklist

- [ ] Context contains exactly one public page URL.
- [ ] Source acquisition ran before Planner/TTS.
- [ ] At least one usable source-media asset exists.
- [ ] Only evidence-manifest media appears in the viewport.
- [ ] Media occupies the dominant area and metadata stays compact.
- [ ] Header says `TIN TỨC` and no media counter is shown.
- [ ] Accent and active subtitle color are orange, never red or cobalt.
- [ ] Each scene has a short factual headline and 1-3 media items.
- [ ] Portrait and informational media are not misleadingly cropped.
- [ ] Videos are muted and short clips loop when required.
- [ ] Scene timing is audio-derived and sums to `totalFrames`.
