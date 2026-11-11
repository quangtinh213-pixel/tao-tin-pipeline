# Template Spec Rules: news/tech-dark

Read this document before running Step 6 (Spec) when `--template news/tech-dark` is specified.

---

## What this template is

Tech news short-form video. Dark editorial design — deep space background, electric cyan/blue gradient accents, glowing cards.

Key characteristics:
- **Background**: deep `#0B0C10` with ambient glow blobs at corners
- **Top accent bar**: 6px cyan→blue gradient line + subtle glow
- **Gradient text**: accent words in headlines, tags, stat numbers use cyan→blue gradient
- **Cards**: dark glass with cyan border glow
- **Particle network**: cyan/blue particles in top 15% of frame
- **Media cards**: images and videos use a dark frame with cyan credit label
- **Vertical 9:16 media**: remains inside the card with a capped media height to prevent scene overflow
- **Fixed subtitles**: word-by-word highlight in cyan at the bottom
- All other pipeline logic (scene types, timing, image rules) is identical to `news/tech-light`

---

## Input handling

Same as `news/tech-light` — fetch article, extract images, follow pipeline.

---

## Step 6 Output

Create `videos/<slug>/spec.json` with `templateId: "news/tech-dark"`:

```json
{
  "templateId": "news/tech-dark",
  "slug": "<slug>",
  "totalFrames": <number>,
  "video": {
    "title": "<Vietnamese title — max 8 words>",
    "date": "<DD/MM/YYYY>",
    "bgMusic": "assets/news/music/news-ambient-01.mp3"
  },
  "scenes": [...]
}
```

`bgMusic`: always set to `"assets/news/music/news-ambient-01.mp3"` — subtle
neutral background music suitable for news. The Layout renders it with loop
using the track's `volume` from `public/assets/news/manifest.json`. Do NOT set
to `null`.

---

## Scene Timing

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract.

---

## Scene Types

Same schema as `news/tech-light` — `hook`, `body`, `ending`.
All fields (`tags`, `badge`, `headline`, `body`, `stat`, `image`, etc.) work identically.
**`cta` is NOT used** — the subscribe button ("Bấm Theo Dõi" + 🔔 shake) is hardcoded in the shared `SceneEnding` component.

The visual difference is purely in the template components — AI only provides data.

---

## Step 7 (Coder)

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { Layout, SceneHook, SceneBody, SceneEnding } from '../templates/news/tech-dark';
import type { NewsTechDarkSpec } from '../templates/news/tech-dark';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as NewsTechDarkSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            {scene.type === 'hook'   && scene.hook   && <SceneHook   {...scene.hook} />}
            {scene.type === 'body'   && scene.body   && <SceneBody   {...scene.body} />}
            {scene.type === 'ending' && scene.ending && <SceneEnding {...scene.ending} />}
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

---

## Checklist before submitting spec.json

- [ ] `templateId` = `"news/tech-dark"`
- [ ] `video.title` ≤ 8 Vietnamese words
- [ ] `video.bgMusic` = `"assets/news/music/news-ambient-01.mp3"` — NOT null
- [ ] Every scene has: `type`, `startFrame`, `durationFrames`, `audioSegment`
- [ ] Every `image.src` is a real `.jpg`/`.jpeg`/`.png`/`.webp`/`.mp4` URL — not `.gif`
- [ ] `stat` used only when scene narrates a specific key number
- [ ] `totalFrames` = last scene's `startFrame` + last scene's `durationFrames`
