# news/health-briefing-light

Fixed template for Vietnamese health news generated from a public article URL.
It is designed for hospital updates, public-health notices, medicine and
vaccine news, nutrition, disease prevention, research findings, health policy,
and patient-impact stories.

## Input Contract

The context should include a public article URL. Use only facts, images, videos,
dates, credits, quotes, numbers, symptoms, recommendations, and attribution
available from that article or its accessible media. Do not fabricate source
media, medical claims, doctor names, institutions, dates, figures, treatment
effects, symptoms, or recommendations.

Prefer this template when the article is about:

- public-health guidance, disease prevention, outbreaks, or warnings;
- hospitals, medicine, vaccines, diagnostics, nutrition, or research;
- official health recommendations and patient/community impact;
- explanatory health stories where clarity and source trust matter.

Do not use it for beauty/lifestyle marketing, miracle cures, supplement sales,
or unsupported medical advice.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Clean medical editorial look: pale mint paper, subtle grid, teal primary
  accent, restrained coral warning color, white evidence cards.
- Typography uses `Newsreader` for large editorial headlines and `Inter` for
  body, labels, cards, and subtitles.
- Source images and videos are rendered as evidence cards with visible
  attribution: `Nguồn: <credit>`.
- Source video is muted and looped.
- Voice subtitles sit near the bottom, with the active spoken word in teal.

## Medical Safety Rules

- Keep a neutral, factual Vietnamese journalistic tone.
- Do not diagnose, prescribe, or promise outcomes.
- Attribute recommendations to the article, a health authority, hospital,
  researcher, or doctor named by the source.
- Distinguish between study finding, official guidance, warning, symptom,
  treatment, and uncertainty.
- Prefer phrases such as "theo bài viết", "theo cơ quan y tế", or "người có
  triệu chứng nên liên hệ cơ sở y tế" when advice appears in the source.
- Avoid sensational wording unless the source itself uses an official emergency
  framing.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface HealthBriefingLightSpec {
  templateId: "news/health-briefing-light";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
  };
  scenes: Array<{
    type: "healthBriefingLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    health: {
      variant:
        | "opening"
        | "evidence"
        | "stat"
        | "symptoms"
        | "recommendation"
        | "timeline"
        | "quote"
        | "closing";
      meta: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      body2?: string;
      media?: {
        src: string;
        storage?: "local" | "remote";
        credit: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
        mediaType?: "ẢNH" | "VIDEO" | "INFOGRAPHIC";
      };
      mediaHeight?: number;
      stat?: { value: string; unit?: string; label: string; note?: string };
      items?: Array<{ label: string; text: string }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      quote?: { text: string; source: string; context?: string };
      notice?: string;
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `opening`: article hook, main health issue, affected group, optional strongest
  source image/video.
- `evidence`: source photo/video, hospital/product/research image, or official
  visual evidence with a short factual explanation.
- `stat`: one central number such as cases, percentage, age group, time window,
  sample size, dosage count, or affected population.
- `symptoms`: 3-5 signs mentioned by the article or health authority.
- `recommendation`: 3-5 practical actions explicitly supported by the source.
- `timeline`: exposure, onset, announcement, recall, policy date, or next review.
- `quote`: doctor, official, researcher, or institutional statement.
- `closing`: what to watch next, who should pay attention, and a cautious final
  source-led takeaway.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Keep other headlines to 2-4 lines.
- Put exact phrases to become teal in `accentWords`.
- Avoid alarmist language unless it is an official warning.

Body rules:

- Keep each body field under about 140 Vietnamese characters.
- Body copy should add context, not duplicate subtitles.
- `notice` is for uncertainty, safety context, or "when to seek care" language.

Media rules:

- Accept still media: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Accept source video: `.mp4`, `.mov`; render muted and looped.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatar
  thumbnails, and decorative icons.
- Remote media must be public and CORS-renderable.
- Every media item must include `credit`.
- If no reliable source media exists, omit `media` and use text, stat, symptom,
  recommendation, timeline, or quote scenes.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer a calm news bed from
  `public/assets/news/manifest.json`, especially `nastelbom-soft-music` or
  `miromaxmusic-music-promotion`.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { HealthScene, Layout } from '../templates/news/health-briefing-light';
import type { HealthBriefingLightSpec } from '../templates/news/health-briefing-light';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as HealthBriefingLightSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            <HealthScene {...scene.health} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

## Checklist

- [ ] `templateId` is `"news/health-briefing-light"`.
- [ ] Context contains a public source URL whenever article media is expected.
- [ ] `video.title` is short and follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- [ ] `video.bgMusic` is `"assets/news/music/nastelbom-soft-music.mp3"` unless
      the user explicitly selected another audio mode.
- [ ] Each scene has audio-derived timing.
- [ ] All media is from the source article or public accessible source media.
- [ ] Every media item has `credit`.
- [ ] Videos are muted and looped.
- [ ] Medical advice is attributed and does not exceed the source.
- [ ] `totalFrames` equals the last scene end frame.
