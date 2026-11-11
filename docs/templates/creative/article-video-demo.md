# Template Spec Rules: creative/article-video-demo

Read this document before Step 2, Step 6, and Step 7 when
`creative/article-video-demo` is selected.

## Identity

This template is not `creative/demo-scroll`.

- `demo-scroll` records a muted browser scroll from a product URL.
- `article-video-demo` extracts the actual embedded video from an article URL,
  preserves its original audio when available, frames it according to its
  native aspect ratio, and plays it once from beginning to end.

The template inherits the creative introduction, safe-area, and visual-quality
rules from [`creative/free-style`](free-style.md). The embedded article video is
the ending and must not be followed by another narration scene.

## Required Input And Early Failure

The context must contain one public `http` or `https` article URL. A direct MP4
URL by itself is not an article URL and does not satisfy this contract.

Run asset acquisition immediately after Step 1, before Planner or TTS:

```bash
node scripts/article-video.mjs "<article-url>" "<slug>"
```

The script inspects article video elements, source elements, Open Graph video
metadata, Twitter stream metadata, JSON-LD, and media responses.

If no embedded video is found, stop the pipeline. Do not create narration,
substitute stock footage, record the web page, or silently fall back to
`demo-scroll`.

An audio track is optional. A valid silent source video must continue through
the pipeline with `hasAudio: false`.

## Remote-First Asset Contract

Successful acquisition creates:

```text
public/<slug>/article-video.json
```

When a direct remote video URL passes media probing:

```json
{
  "articleUrl": "https://publisher.example/article",
  "articleTitle": "Original article title",
  "creator": "Original Creator",
  "publisher": "Publisher Name",
  "sourceCredit": "Nguồn: Original Creator · Publisher Name",
  "sourceUrl": "https://cdn.example/video.mp4",
  "src": "https://cdn.example/video.mp4",
  "storage": "remote",
  "width": 1920,
  "height": 1080,
  "duration": 24.8,
  "hasAudio": true
}
```

## Source And Copyright Attribution

Source attribution is mandatory. The acquisition metadata must retain:

- `articleUrl`: the original article page.
- `sourceUrl`: the extracted video asset URL.
- `creator`: the article author, video creator, or social-account owner when
  available.
- `publisher`: `og:site_name` when available, otherwise the article hostname.
- `articleTitle`: the Open Graph title or document title when available.
- `sourceCredit`: viewer-facing attribution using this priority:
  1. The original article author, video creator, or account that created the
     post.
  2. The publisher, website, or social platform where it was posted.

When both are known, use `Nguồn: <creator> · <publisher>`. When the creator
cannot be identified reliably, use `Nguồn: <publisher>`. Never replace a known
creator with the platform name alone.

Display `sourceCredit` throughout the article-video scene in a readable but
secondary position immediately below the demo video frame. Keep it visually
attached to the source media instead of placing it in a corner of the overall
composition. Do not hide it behind the video, subtitles, or frame edge.
Do not remove attribution when the media is downloaded into `public/<slug>/`.

Attribution does not grant reuse rights. Do not invent a copyright owner,
license, permission statement, or `©` claim unless the article explicitly
provides that information. Preserve any explicit credit or copyright notice
from the supplied context when available, using it instead of a guessed claim.

When the direct URL cannot be consumed reliably, the acquisition script
downloads and normalizes it to H.264 video plus AAC audio when an audio track
exists:

```text
public/<slug>/article-video.mp4
```

The JSON then uses:

```json
{
  "src": "<slug>/article-video.mp4",
  "storage": "local"
}
```

Never call `staticFile()` for a remote URL. The shared `ArticleVideoScene`
handles remote and local sources correctly.

## Story And Voice Contract

This section overrides the common Planner and Teller rules for this template.
Do not use the normal 45-100 second target, 3-6 body segments, or a spoken
ending.

The generated narration must contain only:

1. A strong hook.
2. One concise introduction to the story and only the context needed to
   understand the clip.
3. A final handoff such as: "Và đây là đoạn video trong bài viết."

Target 8-15 seconds of speech. The hard maximum is 20 seconds. If the draft is
longer, shorten the context rather than trimming or hiding any part of the
article video.

Planner output must use exactly these three segments:

```json
{
  "title": "Vietnamese title",
  "hook": "One short hook",
  "segments": [
    {
      "title": "Bối cảnh",
      "content_summary": "Only the minimum context needed to understand the source clip"
    }
  ],
  "ending": "Và đây là đoạn video trong bài viết.",
  "estimated_duration": 12
}
```

Teller output must contain 2-3 short entries total:

```json
{
  "script": [
    {"text": "Short hook", "type": "hook"},
    {"text": "Concise story context", "type": "body"},
    {"text": "Và đây là đoạn video trong bài viết.", "type": "ending"}
  ]
}
```

The `ending` type is only the handoff into the clip. It is not a conclusion,
summary, call to action, or post-demo narration.

Do not generate a spoken ending after the handoff. The voiceover file ends
before the article video begins. The article video then plays with `volume={1}`
from its first frame through its final frame. If the source has no audio track,
it plays silently. In both cases, do not add looping, trimming, speed changes,
narration, subtitles, background music, or SFX.

This terminal-demo structure is mandatory because the shared TTS/STT pipeline
produces one continuous voice file and one continuous timestamp map. Supporting
voice after the demo would require segmented TTS plus timestamp offsetting and
is outside this template.

The final composition may be longer than the normal target because it includes
the complete source clip. Never shorten, cover, or omit the source clip to make
the total video fit a target duration.

## Timing

Use `timeline.json` for introduction scene boundaries. Let:

```text
introFrames = ceil(timeline.duration * 30) + 15
demoFrames  = ceil(article-video.duration * 30)
totalFrames = introFrames + demoFrames
```

The final introduction scene must contain the handoff. Start the demo at exactly
`introFrames`. Do not overlap the narration and source-video audio.

The demo duration must be exactly `demoFrames`. Do not add the normal 60-frame
voice tail after the demo.

## Step 6 Spec

Include the acquired metadata:

```json
{
  "templateId": "creative/article-video-demo",
  "slug": "<slug>",
  "introFrames": 480,
  "demoFrames": 744,
  "totalFrames": 1224,
  "articleVideo": {
    "articleUrl": "https://publisher.example/article",
    "articleTitle": "Original article title",
    "creator": "Original Creator",
    "publisher": "Publisher Name",
    "sourceCredit": "Nguồn: Original Creator · Publisher Name",
    "sourceUrl": "https://cdn.example/video.mp4",
    "src": "https://cdn.example/video.mp4",
    "storage": "remote",
    "width": 1920,
    "height": 1080,
    "duration": 24.8,
    "hasAudio": true
  },
  "scenes": [
    {
      "type": "hook",
      "startFrame": 0,
      "durationFrames": 210,
      "audioSegment": {"start": 0, "end": 7, "text": "..."}
    },
    {
      "type": "intro",
      "startFrame": 210,
      "durationFrames": 270,
      "audioSegment": {"start": 7, "end": 15.5, "text": "..."}
    },
    {
      "type": "articleVideo",
      "startFrame": 480,
      "durationFrames": 744,
      "audioSegment": null
    }
  ]
}
```

Creative intro scenes follow `creative/free-style`. The article-video scene is
the one deliberate exception to the subtitle safe zone because subtitles are
disabled during source playback.

## Step 7 Coder

Use:

```tsx
import {Audio, Sequence, staticFile} from 'remotion';
import {
  ArticleVideoDemoLayout,
  ArticleVideoScene,
} from './templates/creative/article-video-demo';
```

Composition pattern:

```tsx
<ArticleVideoDemoLayout
  slug={slug}
  introDurationInFrames={spec.introFrames}
  background={COLORS.bg}
  subtitleAccent={COLORS.accent}
>
  <Sequence durationInFrames={spec.introFrames} premountFor={30}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <IntroScenes />
  </Sequence>
  <Sequence
    from={spec.introFrames}
    durationInFrames={spec.demoFrames}
    premountFor={30}
  >
    <ArticleVideoScene
      src={spec.articleVideo.src}
      width={spec.articleVideo.width}
      height={spec.articleVideo.height}
      durationInFrames={spec.demoFrames}
      hasAudio={spec.articleVideo.hasAudio}
      sourceCredit={spec.articleVideo.sourceCredit}
    />
  </Sequence>
</ArticleVideoDemoLayout>
```

Do not add `<Audio>` for the article video: any original audio comes from the
`<Video>` element. Do not render background music or transition SFX.

## Final Checklist

- [ ] Template ID is `creative/article-video-demo`
- [ ] Input contains an article URL, not merely a direct media URL
- [ ] Acquisition ran before Planner/TTS
- [ ] Missing embedded video stopped the pipeline
- [ ] `article-video.json` exists and accurately reports `hasAudio`
- [ ] Remote direct URL is preferred; local MP4 exists only as fallback
- [ ] Original article URL, video URL, creator, publisher, and title remain in metadata
- [ ] Attribution prioritizes the creator before the publication platform
- [ ] `sourceCredit` is visible throughout the complete demo
- [ ] No copyright owner, license, permission, or `©` claim is invented
- [ ] Spoken script ends with the handoff
- [ ] Spoken introduction targets 8-15 seconds and never exceeds 20 seconds
- [ ] Planner has exactly one context segment; Teller has only 2-3 short entries
- [ ] No analysis, conclusion, CTA, or narration appears after the handoff
- [ ] Voiceover, subtitles, music, and SFX are absent during demo playback
- [ ] Demo is centered and framed using its native width/height
- [ ] Demo plays once at normal speed through its final frame
- [ ] Source audio plays at full volume when an audio track exists
- [ ] Composition ends when the demo ends
