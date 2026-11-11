# news/health-public-alert

Fixed public-health alert template for Vietnamese health news generated from a
public article URL. It is designed for disease warnings, food or medicine
recalls, contaminated products, outbreak monitoring, pollution/health risks,
urgent hospital guidance, and official public-health recommendations.

## Input Contract

The context should include a public article URL. Use only facts, images, videos,
dates, credits, quotes, affected groups, product names, locations, symptoms,
timelines, and recommendations available from that article or accessible source
media. Do not fabricate source media, medical claims, doctor names,
institutions, product batches, locations, symptoms, case counts, recall scope,
or recommendations.

Prefer this template when the article is about:

- official warning, recall, outbreak, contamination, medicine/food safety;
- a health issue where viewers need to know who is affected and what to do;
- symptoms or action steps that must be scanned quickly;
- public-health communication from a named authority, hospital, or regulator.

Use `news/health-briefing-light` instead for calmer explanatory health stories,
research summaries, hospital features, nutrition explainers, or non-urgent
medical news.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Public-health bulletin look: warm off-white paper, compact grid, black text,
  amber/coral alert accents, and high-contrast action cards.
- Typography uses `Roboto Condensed` for uppercase bulletin headlines and
  `Inter` for body, labels, action cards, captions, and subtitles.
- Source images/videos are rendered in bordered evidence cards with visible
  attribution: `Nguồn: <credit>`.
- Source video is muted and looped.
- Voice subtitles sit near the bottom, with the active spoken word in coral.

## Medical Safety Rules

- Keep a sober, factual Vietnamese tone. Urgent does not mean sensational.
- Do not diagnose, prescribe, or promise outcomes.
- Attribute all recommendations to the article, authority, hospital,
  researcher, doctor, or regulator named by the source.
- Distinguish warning, advisory, confirmed recall, suspected risk, symptom, and
  pending investigation.
- Never invent product batch numbers, locations, affected groups, symptoms, or
  "what to do" steps.
- Use action language only when the source supports it.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
type AlertLevel = "watch" | "advisory" | "warning" | "urgent";

interface HealthPublicAlertSpec {
  templateId: "news/health-public-alert";
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
    type: "healthPublicAlert";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    alert: {
      variant:
        | "alertOpening"
        | "sourceEvidence"
        | "affectedGroup"
        | "riskLevel"
        | "symptomChecklist"
        | "actionSteps"
        | "avoidList"
        | "timeline"
        | "sourceQuote"
        | "closing";
      level?: AlertLevel;
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
      riskLabel?: string;
      riskValue?: string;
      riskNote?: string;
      items?: Array<{ label: string; text: string; tone?: "neutral" | "warning" | "safe" }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      quote?: { text: string; source: string; context?: string };
      sourceLine?: string;
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Level Guide

| Level | Label | Use |
|---|---|---|
| `watch` | THEO DÕI | developing issue, mild risk, unclear scope |
| `advisory` | KHUYẾN CÁO | official guidance, prevention steps |
| `warning` | CẢNH BÁO | confirmed risk, recall, outbreak, unsafe product |
| `urgent` | KHẨN | immediate official action or severe public-health risk |

Do not choose `urgent` merely to make the video dramatic.

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `alertOpening`: what happened, alert level, affected topic/group, optional
  source media, and a short risk panel.
- `sourceEvidence`: source photo/video, official product image, hospital scene,
  field image, or infographic from the article.
- `affectedGroup`: who should pay attention, such as age group, location,
  consumer group, patients, or households.
- `riskLevel`: one clear risk statement, count, product scope, or official
  status. Use `riskLabel`, `riskValue`, and `riskNote`.
- `symptomChecklist`: 3-5 signs mentioned by the article or authority.
- `actionSteps`: 3-5 supported steps viewers should take.
- `avoidList`: 2-5 things the source says not to do.
- `timeline`: announcement, exposure window, recall date, investigation stage,
  or next update.
- `sourceQuote`: doctor, authority, regulator, researcher, or hospital quote.
- `closing`: source-led reminder and what to monitor next.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short uppercase lines.
- Keep other headlines to 2-4 lines.
- Put exact phrases to become coral/level color in `accentWords`.
- Avoid panic language unless it is an official emergency phrase from the source.

Body rules:

- Keep each body field under about 135 Vietnamese characters.
- Body copy should add context, not duplicate subtitles.
- `sourceLine` is for explicit attribution, uncertainty, or safety framing.

Media rules:

- Accept still media: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Accept source video: `.mp4`, `.mov`; render muted and looped.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatar
  thumbnails, and decorative icons.
- Remote media must be public and CORS-renderable.
- Every media item must include `credit`.
- If no reliable source media exists, omit `media` and use risk/action/timeline
  scenes.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer `assets/news/music/grand_project-breaking-news-background-music_short.mp3`
  only for genuinely urgent stories; otherwise use
  `assets/news/music/news-ambient-01.mp3`.
- The registry default is `assets/news/music/news-ambient-01.mp3` to avoid
  overdramatizing routine health alerts.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { AlertScene, Layout } from '../templates/news/health-public-alert';
import type { HealthPublicAlertSpec } from '../templates/news/health-public-alert';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as HealthPublicAlertSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            <AlertScene {...scene.alert} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

## Checklist

- [ ] `templateId` is `"news/health-public-alert"`.
- [ ] Context contains a public source URL whenever article media is expected.
- [ ] `level` matches the source's seriousness and is not inflated.
- [ ] `video.bgMusic` follows the selected audio mode; default is
      `"assets/news/music/news-ambient-01.mp3"`.
- [ ] Each scene has audio-derived timing.
- [ ] All media is from the source article or public accessible source media.
- [ ] Every media item has `credit`.
- [ ] Videos are muted and looped.
- [ ] Actions, symptoms, affected groups, and avoid-list items are source-backed.
- [ ] Medical advice is attributed and does not exceed the source.
- [ ] `totalFrames` equals the last scene end frame.
