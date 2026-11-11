# Template Spec Rules: news/media-showcase

Read this document before Step 2, Step 6, and Step 7 when
`--template news/media-showcase` is selected.

This is a **fixed, media-first news slideshow**. It follows a red-and-white
television-news frame with:

- one large image/video viewport;
- a visible source strip attached to the media;
- publication date;
- a short, large headline;
- voiceover, subtitles, and restrained background music.

The images and videos extracted from the supplied URL are the main content.
Do not replace them with stock media, AI media, charts, decorative graphics, or
generic illustrations.

The media viewport is strictly source-media-only:

- Do not generate any content, illustration, diagram, icon, card, quote, stat,
  transition graphic, or explanatory text inside it.
- Do not place labels, badges, headlines, captions, or branding over the media.
- The only elements outside the viewport are the fixed source strip,
  publication date, title, subtitles, and template frame.
- Keep showing source images/videos until the narration ends.
- Only exception: the A/B hook card (see "Hook Card A/B Test" below), which
  may sit over the lower part of the viewport during the hook when its arm is
  `card`. It never covers the source strip.
- When the available media runs out, restart from the first selected asset and
  continue cycling in the same order.

## Required URL And Acquisition

The generation context must contain exactly one primary public `http` or
`https` article/content page URL. Extra instructions may accompany it.

Immediately after Step 1, before Planner or TTS, run:

```bash
node scripts/source-evidence.mjs "<page-url>" "<slug>"
```

This creates:

```text
videos/<slug>/source-context.txt
public/<slug>/source-evidence.json
public/<slug>/evidence/image-*.*
```

Use `source-context.txt` as the primary factual input for Planner and Teller.
Use `source-evidence.json` as the only source of slideshow media.

### Maximum Source-Media Coverage

Treat `source-evidence.json` as the complete usable-asset inventory, not a
small preview or top-N shortlist. Exhaust all public article discovery paths
before planning, including:

- `<video>` and `<source>` elements, embedded direct media URLs, article
  galleries and lightboxes;
- `<img>`, `<picture>`, responsive `srcset`, lazy-load attributes, Open Graph,
  Twitter metadata, and JSON-LD;
- public media URLs observed in the article's network responses when they pass
  URL validation and media probing.

Do not stop discovery after the first usable asset or after an arbitrary count.
Collect all unique public candidates that can be probed, then apply the
usability/provenance checks after the full inventory is available. Every
candidate that passes those checks must remain in the manifest, even when it
is later excluded from the rendered selection.

Media acquisition priority is:

1. Direct video sources embedded in the article.
2. Direct video URLs found in article metadata, JSON-LD, or observed network
   responses when they pass public URL and media probing.
3. Article images from the DOM, responsive/lazy image attributes, Open Graph or
   Twitter metadata, JSON-LD, and observed network responses.

Probe all video candidates before downloading image candidates. The evidence
manifest lists usable videos before images, while preserving discovery order
within each media type. Keep both media classes when both contain relevant
usable assets; video-first is an acquisition order, not permission to discard
article images after finding a video. Never substitute stock or AI media.

Unlike `creative/source-led-*`, this template requires usable media. Stop before
Planner/TTS when `stats.usableAssetCount` is zero.

The extractor may not obtain protected media from YouTube, TikTok, Facebook,
Instagram, or similar iframe players. Do not fabricate or substitute media when
the page exposes no usable direct asset.

## Media Selection

- Use every relevant, unique, usable image/video from the evidence manifest by
  default. There is no top-N or arbitrary asset limit.
- At Step 6, compare the full manifest with `mediaAssets`. If a relevant
  usable asset is not selected, state the concrete reason before rendering;
  never silently drop it merely because there are many assets or because the
  default narration has only a few beats.
- Preserve source order where it supports the article narrative.
- Exclude duplicate images, logos, avatars, ads, icons, and unrelated media.
- Exclude protected or unusable media only when the public probe or provenance
  check fails; do not count it as a usable asset, and distinguish probe or
  provenance failures from editorial exclusions when reporting selection.
- Do not reuse an asset unless the user explicitly asks for repetition.
- Exception: when there are not enough assets to cover the full video, reuse
  them cyclically in source order until the final frame.
- Each scene contains 1-3 media items.
- Distribute all selected media across narration scenes; multiple items inside
  one scene rotate as a slideshow. If coverage needs more scene rotation, adapt
  the media allocation within the timing contract rather than discarding source
  media or padding the narration.
- Keep video muted with `volume={0}`.
- Loop a video clip when its selected interval is shorter than its assigned
  display duration.
- Use `cover` for wide media only when important content remains visible.
- Use `contain` for portrait media, infographics, screenshots, or sensitive
  framing.
- **Opening asset (scene 1, first media item):** choose a landscape photo of
  people, the scene, or the object of the story. Never open on a press-notice
  graphic, text card, infographic, screenshot, or portrait (`contain`) asset;
  move those later in the order. VN News Analytics (10/2026): portrait openers
  held ~46% median view percentage and video openers ~44%, versus ~50% for
  landscape photos. Open on an article video only when its chosen
  `clipStartSeconds` skips any logo/intro bumper and lands on action.
- A scene holding one photo longer than ~3s is automatically cut between crops
  of that photo every 2.5s (`getImageMotion`); keep important content near the
  center so every crop still shows it.
- For video, set a relevant `clipStartSeconds` and `clipEndSeconds`. Never
  select an arbitrary interval merely to add motion.

## Planner And Teller: TikTok News Script Contract

This template is used for a TikTok news channel. Keep the reporting factual,
but make the narration curiosity-driven, fast to understand, and easy to follow
without sound context from the article page. The target narration length is
20-35 seconds (about 75-125 words; `scripts/script-rules.mjs` rejects more
than 140). Never pad the script to reach a duration;
when the article is rich, cut the weakest facts instead of running long.

Planner reads:

- `videos/<slug>/context.txt`;
- `videos/<slug>/source-context.txt`;
- `public/<slug>/source-evidence.json`.

Before writing the plan, separate the source into three internal buckets:

- confirmed facts stated by the article or an identified authority;
- attributed claims, which must retain their source or legal qualifier;
- unresolved details, which must be presented as unknown or under investigation.

Do not add these buckets to the public narration as labels. Use them as a fact
check before selecting the angle and wording.

Plan 3-5 concise narration beats depending on article length and media count.
Use this Shorts pacing model (20-35 seconds total):

1. **Hook, first ~4 seconds:** the strongest verified fact, tension, contrast, or
   unanswered question, at most 22 words, no greeting or intro, never the
   outcome (`docs/gen-video/script-writing/SCRIPT_RULES.md` §2.1).
2. **Quick answer, 4-9 seconds:** what happened, where, and when in one or two
   clear sentences.
3. **Key facts, 9-24 seconds:** two to three short beats, one important fact
   per sentence or thought. Keep the payoff (outcome, twist, verdict) for the
   last of these beats.
4. **Status and payoff, 24-30 seconds:** what is confirmed, what remains
   unclear, and the answer the hook opened.
5. **Ending, final ~5 seconds:** one short takeaway or the next confirmed
   development, then one open opinion question for comments, following
   `docs/gen-video/script-writing/SCRIPT_RULES.md` §7. No follow/subscribe line.

Scale the timings down proportionally for a 20-second video; never run past 35
seconds.

Draft three hook candidates internally and choose the strongest one that is
fully supported by the source. A factual hook may be attention-grabbing, but it
must not invent a motive, imply guilt, inflate the scale, or promise a reveal
that the article does not contain. Prefer specific places, dates, numbers,
sequence changes, and confirmed new details over generic words such as “sốc”
or “kinh hoàng”.

The narration explains the article; it must not repeatedly say “trong ảnh” or
“trong video”, and it must not infer facts from how a source image looks.

### Factual clickbait and sensitive-language rules

Use natural, neutral Vietnamese wording that preserves the meaning of the
source. Do not use coded euphemisms or slang to conceal facts or bypass a
platform safety system. Replace sensational or legally premature wording only
when the replacement remains precise:

| Avoid when unsupported or premature | Use when factually accurate |
| --- | --- |
| “hung thủ” before a final conviction | “nghi phạm”, “người bị cáo buộc”, or “bị cáo” |
| graphic descriptions of stabbing, cutting, blood, or injury | “xảy ra vụ tấn công” or the verified method only when necessary to understand the story |
| “giết” when causality is not established | “tử vong trong vụ việc” or “khiến ... tử vong” only when the source confirms the causality |
| “cưỡng hiếp” as an established fact during an allegation | “cáo buộc xâm hại tình dục” |
| “bắt cóc” when authorities have not confirmed it | “vụ việc nghi bắt cóc” or “cáo buộc bắt cóc” |
| “máu me”, “kinh hoàng”, and similar graphic adjectives | omit the graphic adjective and state the verified event |

Preserve qualifiers such as “theo cơ quan chức năng”, “theo thông tin ban
đầu”, “bị cáo buộc”, and “đang được điều tra”. Do not turn an allegation into a
fact, call a person a criminal before the legal status supports it, identify a
minor unnecessarily, or include graphic details that do not help explain the
news. Do not use vague phrases such as “ra đi mãi mãi” when “tử vong” is the
factually correct term.

Teller converts the approved plan into the common `script` schema:

```json
{
  "script": [
    {"text": "Factual curiosity-driven opening.", "type": "hook"},
    {"text": "Short verified context.", "type": "body"},
    {"text": "Key fact with its source qualifier.", "type": "body"},
    {"text": "Confirmed status and what remains unclear.", "type": "body"},
    {"text": "Concise factual ending.", "type": "ending"}
  ]
}
```

Every text entry must be non-empty Vietnamese. Keep sentences short enough for
voiceover, preserve numbers and names exactly as supported by the source, and
map each claim back to `source-context.txt` before finalizing the script.

## Step 6 Spec

Write:

```json
{
  "templateId": "news/media-showcase",
  "slug": "<slug>",
  "totalFrames": 1200,
  "video": {
    "title": "Tiêu đề duy nhất giữ nguyên xuyên suốt video",
    "date": "17.6.2026",
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
      "caption": "Original caption",
      "alt": "Original alt",
      "width": 1600,
      "height": 900
    }
  ],
  "scenes": [
    {
      "startFrame": 0,
      "durationFrames": 240,
      "audioSegment": {"start": 0, "end": 8, "text": "..."},
      "media": [
        {"assetId": "image-01", "fit": "cover"}
      ]
    }
  ]
}
```

Rules:

- `mediaAssets` contains each selected manifest asset exactly once.
- By default, `mediaAssets` contains every relevant unique usable asset from the
  complete evidence manifest. Any difference between the usable relevant
  inventory and the selected list requires an explicit exclusion reason.
- Every `scene.media[].assetId` resolves to one `mediaAssets[]` entry.
- Every scene contains at least one media item.
- Assign media continuously through all scenes. If the last asset is reached
  before the video ends, return to the first asset.
- Pacing: give each scene about `ceil(sceneSeconds / 3)` media items (minimum
  1) so the frame changes every 2-3 seconds; never place the same asset twice
  in a row. The scene component also cycles a scene's media when 2+ items
  would otherwise hold longer than 3 seconds, but it cannot add assets the
  spec did not assign.
- `video.title` and `video.date` are global immutable display values.
- Render exactly the same `video.title` and `video.date` for every frame. Never
  derive or replace them from scene narration.
- `video.title` should usually stay under 90 Vietnamese characters.
- Write `video.title` by the Title rules in
  `docs/gen-video/common-pipeline.md`: curiosity first, never a copied print
  headline. For economic, business or policy articles, use the ordinary
  viewer's angle (what it changes for their money or daily life). It stays
  global and unchanged; do not create a different headline for each scene.
- Daily gold-price stories (the `/tao-tin` "Giá vàng hôm nay" series) start
  `video.title` with `Giá vàng hôm nay:` so viewers recognize the series.
- Use the article publication date when available; otherwise use the generation
  date and do not label it as the article's publication date in narration.
- Choose one gentle track from `public/assets/news/manifest.json`. Prefer
  `nastelbom-soft-music.mp3` or `miromaxmusic-music-promotion.mp3`; use urgent
  music only for genuinely urgent stories.
- Timing follows `docs/gen-video/common-pipeline.md`.

### Hook Card A/B Test (11/2026)

VN News Analytics: in 34 of 55 Shorts the steepest viewer drop happened inside
the hook (seconds 4-6). This test checks whether one large source-backed figure
on screen during the hook keeps more viewers.

- Add `hookCard` to the spec whenever the article has one concrete figure or
  short detail that sharpens the hook: an amount, a count, a duration, an age.
  Omit it when the article has none; never invent or round a figure.
- Write `hookCard` before knowing the arm, the same way for every video:

  ```json
  "hookCard": {
    "value": "50 tỉ",
    "label": "đồng bị chiếm đoạt",
    "sourceQuote": "chiếm đoạt khoảng 50 tỉ đồng"
  }
  ```

  - `value`: at most 12 characters, the figure exactly as the source writes it.
  - `label`: at most 48 characters, says what the figure counts. Same factual
    rules as the hook: no outcome reveal, no guilt, no hype label.
  - `sourceQuote`: copied verbatim from `source-context.txt` and containing
    every digit in `value`.
- Prefer a figure the hook does not already say aloud, so the card adds a
  second detail instead of repeating the narration.
- Then run `node scripts/hook-card.mjs <slug>`. It rejects an unsupported
  card (fix or remove it) and stamps `hookCard.arm`: `card` renders the card,
  `control` renders nothing. Never edit `arm` by hand; the split by slug keeps
  the two groups comparable.
- `npm run youtube:report` compares the two arms (median view percentage and
  viewers left at 30% of the video).

## Step 7 Coder

Read:

- `docs/remotion-best-practices/SKILL.md`;
- rules for images, videos, sequencing, timing, and subtitles.

Use the fixed components in:

```text
src/templates/news/media-showcase/
```

Implementation outline:

1. Import `Layout`, `MediaShowcaseScene`, and `MediaShowcaseSpec`.
2. Resolve each `scene.media[].assetId` from `spec.mediaAssets`.
3. Render scenes with `<Series>`.
4. Add the normal voiceover `<Audio>`.
5. Pass `spec.video.title` and `spec.video.date` once to the persistent
   `Layout`; do not pass scene-specific alternatives.
6. Pass only publisher, media, and `durationFrames` to each
   `MediaShowcaseScene`.
7. Do not change the frame, palette, typography, media viewport, or headline
   placement per story.
8. Keep subtitles enabled in production and disabled in template-dev.
9. Lock the subtitle active-word color to the template red (`#D92343`).
10. Never render generated content inside the media viewport. It contains only
   the selected `<Img>` or muted `<Video>`.
11. When `spec.hookCard?.arm === 'card'`, render `<HookCard>` in a `<Sequence>`
   from `HOOK_CARD_START_FRAME` lasting `getHookCardFrames(scene 1 frames)`,
   after the scenes. Render nothing for `control` or a missing arm.

## Visual Contract

- 1080x1920, 9:16.
- Red vertical rail on the left.
- Pale header band with a black rule.
- Media viewport occupies the dominant upper area.
- Date label sits below the media in a gray rectangle.
- Headline is large, black, and left-aligned.
- Date and headline remain mounted and unchanged for the entire video.
- Source attribution stays visible while media is visible.
- Subtitle active words are red.
- Animations are restrained: fade, slight reveal, gentle Ken Burns for images.
- No logos copied from the reference image.
- No lower-third branding copied from a broadcaster.

## Checklist

- [ ] Context contains one public page URL.
- [ ] Acquisition runs before Planner/TTS.
- [ ] All public article media discovery paths were exhausted; no top-N or
      arbitrary asset cap was applied.
- [ ] All direct article videos were probed before image downloads, and usable
      images were retained when the article exposed both media classes.
- [ ] At least one usable image/video exists.
- [ ] Every relevant usable asset is selected, or its concrete exclusion reason
      is recorded before rendering.
- [ ] Only media from `source-evidence.json` is used.
- [ ] `hookCard` is present when the article has a concrete figure, and
      `node scripts/hook-card.mjs <slug>` passed and stamped its arm.
- [ ] The media viewport contains only images/videos, with no generated overlay
      except the hook card in the `card` arm.
- [ ] Every visible asset has source attribution.
- [ ] Source video is muted.
- [ ] Media cycles continuously to the end when assets are insufficient.
- [ ] Subtitle active-word color is red.
- [ ] `video.date` and `video.title` remain identical on every frame.
- [ ] The hook was selected from multiple factual candidates and has direct source support.
- [ ] The hook creates curiosity without inventing guilt, motive, scale, or a reveal.
- [ ] Legal status and attribution qualifiers are preserved for allegations and investigations.
- [ ] Sensitive wording is precise and non-graphic; no coded euphemisms obscure the facts.
- [ ] The narration follows hook, quick answer, key facts, status, and ending pacing.
- [ ] Narration is 20-35 seconds (`script-rules.mjs` passes), the hook is at most 22 words, the payoff lands in the last beats, and it ends with one open opinion question.
- [ ] Each scene has 1-3 media items.
- [ ] Media is not cropped misleadingly.
- [ ] Background music comes from the news manifest.
- [ ] Scene timing is audio-derived and sums to `totalFrames`.
