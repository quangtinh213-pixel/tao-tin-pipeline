# news/entertainment-premiere-dark

Fixed dark-tone template for Vietnamese entertainment news generated from a
public article URL or source-backed text. It is designed for film premieres,
music releases, concerts, awards, celebrity profiles, fashion events, books,
streaming charts, reviews, and pop-culture stories that benefit from a night
show or premiere mood.

## Input Contract

Use only facts, images, videos, dates, credits, names, quotes, release details,
rankings, box-office figures, ratings, awards, fashion brands, publishers, and
attribution available from the supplied article or public source media. Do not
fabricate source media, statements, personal relationships, accusations, sales
numbers, chart positions, reviews, awards, or private-life details.

Prefer this template when the article is about:

- film premieres, award nights, concerts, comeback stages, music videos, or
  streaming launches;
- celebrity profiles, red carpet, fashion night events, festival coverage, or
  culture stories with strong night-stage visuals;
- rankings, box office, review reception, or fan reaction where a darker
  entertainment-news mood is appropriate.

Use `news/entertainment-magazine-light` for calmer daytime magazine stories,
books/features with softer art direction, or fashion/lifestyle pieces that need
more whitespace.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Dark premiere look: black-wine background, soft stage spotlights, gold/coral
  accents, restrained grid texture, and deep media frames.
- **No top border, no top accent bar, and no color strip at the top edge.**
- Typography uses `Newsreader` for expressive headlines and `Inter` for labels,
  body, facts, quotes, captions, and subtitles.
- The visual language should feel like a culture premiere or night magazine,
  not a tech dashboard, civic situation room, medical bulletin, or light
  magazine recolor.
- Source images and videos are rendered as poster/photo frames with visible
  attribution: `Nguồn: <credit>`.
- Source video is muted and looped.
- Voice subtitles sit near the bottom, with the active spoken word in gold.

## Editorial Safety Rules

- Keep a lively but factual Vietnamese journalistic tone.
- Do not use insulting, invasive, or certainty-heavy language about private
  life, relationships, accusations, illness, or legal matters.
- If the source frames something as rumor, speculation, fan reaction, or social
  media discussion, preserve that uncertainty.
- Attribute quotes and reviews to the source, outlet, critic, publisher,
  artist, studio, organizer, or named person.
- Distinguish between official announcement, reported claim, review opinion,
  chart/ranking, fan reaction, and unverified social-media discussion.
- Do not invent review scores, box-office data, streaming ranks, awards, or
  publication dates.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface EntertainmentPremiereDarkSpec {
  templateId: "news/entertainment-premiere-dark";
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
    type: "entertainmentPremiereDark";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    entertainment: {
      variant:
        | "opening"
        | "profile"
        | "release"
        | "media"
        | "quote"
        | "timeline"
        | "rank"
        | "review"
        | "gallery"
        | "closing";
      section: string;
      headline: string;
      accentWords?: string[];
      kicker?: string;
      body?: string;
      body2?: string;
      media?: {
        src: string;
        storage?: "local" | "remote";
        credit: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
        mediaType?: "ẢNH" | "VIDEO" | "POSTER" | "BÌA SÁCH" | "LOOKBOOK";
      };
      mediaHeight?: number;
      facts?: Array<{ label: string; value: string; note?: string }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      quote?: { text: string; source: string; context?: string };
      rating?: { label: string; value: string; note?: string };
      tags?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Step 6 Output

Create:

```json
{
  "templateId": "news/entertainment-premiere-dark",
  "slug": "<slug>",
  "totalFrames": 1200,
  "video": {
    "title": "<Vietnamese title - max 8 words>",
    "date": "<DD/MM/YYYY>",
    "bgMusic": "assets/news/music/news-ambient-01.mp3"
  },
  "scenes": []
}
```

`bgMusic` should usually be `"assets/news/music/news-ambient-01.mp3"`.
For softer culture features, `"assets/news/music/nastelbom-soft-music.mp3"` is
acceptable when explicit audio mode keeps music enabled.

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract.

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `opening`: main hook with strongest poster, portrait, stage, red-carpet, or
  event image.
- `profile`: artist, actor, author, designer, director, or public figure
  context.
- `release`: album, film, series, book, collection, concert, show, or campaign
  detail. Use `facts` for date, platform, venue, publisher, studio, or format.
- `media`: source poster, still, cover art, runway or event image with factual
  body copy.
- `quote`: attributed quote, review excerpt, official statement, or article
  quote. Do not invent quotes.
- `timeline`: release timeline, controversy sequence, award path, tour schedule,
  or public-reaction sequence. Keep it source-backed.
- `rank`: chart position, box-office figure, streaming rank, bestseller list,
  award count, or social metric from the source.
- `review`: critical reception or comparison. Use `rating` only when the source
  provides a score, label, or clear ranking.
- `gallery`: second/third source visual such as red carpet, lookbook, book cover,
  still image, stage image, or poster detail.
- `closing`: what happens next, next release date, award night, official
  response, or source-led takeaway.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Keep other headlines to 2-4 lines.
- Put exact phrases to become gold italic in `accentWords`.
- Avoid tabloid phrasing, insults, and invasive private-life framing.

Copy rules:

- `section` is a short uppercase pass label such as `MUSIC`, `FILM`, `BOOKS`,
  `FASHION`, `PROFILE`, `REVIEW`, `AWARDS`, `POP CULTURE`.
- `kicker` is optional and should be short, not a second headline.
- Keep each body field under about 135 Vietnamese characters.
- Use `tags` for short culture categories such as `Album`, `Premiere`, `Runway`,
  `Bestseller`, `Streaming`, `Oscar`, `Phỏng vấn`.
- Do not duplicate subtitles in scene text.

Media rules:

- Accept still media: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Accept source video: `.mp4`, `.mov`; render muted and looped.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatar
  thumbnails, and unrelated decorative icons.
- Remote media must be public and CORS-renderable.
- Every media item must include `credit`.
- Use `mediaType: "POSTER"` for film/music posters, `"BÌA SÁCH"` for book
  covers, and `"LOOKBOOK"` for fashion/editorial images when appropriate.
- If no reliable source media exists, prefer `quote`, `timeline`, `rank`,
  `review`, or text-led `release` scenes.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { EntertainmentScene, Layout } from '../templates/news/entertainment-premiere-dark';
import type { EntertainmentPremiereDarkSpec } from '../templates/news/entertainment-premiere-dark';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as EntertainmentPremiereDarkSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            <EntertainmentScene
              {...scene.entertainment}
              durationFrames={scene.durationFrames}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

## Checklist

- [ ] `templateId` is `"news/entertainment-premiere-dark"`.
- [ ] `video.title` is short and follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- [ ] There is no top border, top accent bar, or top color strip.
- [ ] `video.bgMusic` is normally `"assets/news/music/news-ambient-01.mp3"`.
- [ ] Each scene has audio-derived timing.
- [ ] All media is from the article or an accessible public source.
- [ ] Every media item has `credit`.
- [ ] Source videos are muted and looped.
- [ ] Quotes, rankings, ratings, awards, and sales numbers are attributed.
- [ ] Rumor/speculation remains clearly qualified.
- [ ] `totalFrames` equals the last scene end frame.
