# news/sports-arena-dark

Fixed dark arena template for Vietnamese sports news generated from a public
article URL or source-backed text. It is designed for football, basketball,
boxing, MMA, tennis, racing, esports, match reports, previews, standings,
transfer updates, rankings, and athlete stories.

## Input Contract

Use only facts, images, videos, dates, credits, scores, rankings, fixtures,
quotes, injuries, penalties, venues, records, and attribution available from
the supplied article or public source media. Do not fabricate source media,
final scores, scorers, cards, fight results, statistics, rankings, schedules,
injury details, transfer fees, suspensions, or quotes.

Prefer this template when the article is about:

- football, basketball, martial arts, tennis, racing, esports, or other sports;
- match results, previews, tactical turning points, player performance, fight
  cards, standings, awards, transfers, and fixtures;
- stories where scores, athletes, timeline, stats, or next-match context are
  central.

Use a calmer current-affairs or entertainment template when the sports angle is
minor and the article is mainly politics, public policy, business, or celebrity
profile.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Dark arena look: graphite background, stadium floodlights, subtle field/court
  line texture, scoreboard panels, and bright sport-specific accents.
- Typography uses `Roboto Condensed` for scoreboard headlines and `Inter` for
  body, labels, captions, stats, and subtitles.
- Accent color adapts by `sport`: football green, basketball orange, combat
  red, tennis blue-green, racing cyan, esports violet, fallback gold.
- Source images and videos are rendered as match/photo cards with visible
  attribution: `Nguồn: <credit>`.
- Source video is muted and looped.
- Voice subtitles sit near the bottom, with the active spoken word in the
  selected sport accent.

## Editorial Safety Rules

- Keep an energetic but factual Vietnamese sports-news tone.
- Do not present rumors, transfer talks, injuries, suspensions, doping issues,
  or disciplinary cases as confirmed unless the source confirms them.
- Attribute quotes to the player, coach, fighter, club, league, organizer, or
  outlet named by the source.
- Distinguish official score, reported claim, preview prediction, ranking,
  coach opinion, fan reaction, and rumor.
- Never invent match statistics or fixtures just to fill a stat board.
- Avoid mocking athletes, teams, referees, or fans.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
type SportKind =
  | "football"
  | "basketball"
  | "mma"
  | "boxing"
  | "tennis"
  | "racing"
  | "esports"
  | "other";

interface SportsArenaDarkSpec {
  templateId: "news/sports-arena-dark";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    sport?: SportKind;
    competition?: string;
    venue?: string;
    matchDate?: string;
  };
  scenes: Array<{
    type: "sportsArenaDark";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    sports: {
      variant:
        | "opening"
        | "scoreline"
        | "playerSpotlight"
        | "turningPoint"
        | "statBoard"
        | "timeline"
        | "quote"
        | "fixture"
        | "closing";
      sport?: SportKind;
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
        mediaType?: "ẢNH" | "VIDEO" | "POSTER" | "INFOGRAPHIC";
      };
      mediaHeight?: number;
      score?: {
        home: string;
        away: string;
        homeScore?: string;
        awayScore?: string;
        status?: string;
        note?: string;
      };
      stats?: Array<{ label: string; value: string; note?: string }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      quote?: { text: string; source: string; context?: string };
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
  "templateId": "news/sports-arena-dark",
  "slug": "<slug>",
  "totalFrames": 1200,
  "video": {
    "title": "<Vietnamese title - max 8 words>",
    "date": "<DD/MM/YYYY>",
    "sport": "football",
    "competition": "<league/tournament if known>",
    "bgMusic": "assets/news/music/sonican-flash-news.mp3"
  },
  "scenes": []
}
```

For omitted `--audio`, prefer
`"assets/news/music/sonican-flash-news.mp3"` for match/result news or
`"assets/news/music/news-ambient-01.mp3"` for calmer preview/analysis stories.

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract.

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `opening`: match/event hook, main athlete/team, competition, optional strongest
  match image/video, and optional score.
- `scoreline`: final score, round result, aggregate score, set score, fight
  result, or ranking result.
- `playerSpotlight`: athlete, coach, fighter, driver, or team performance.
- `turningPoint`: goal, knockdown, red card, clutch shot, pit stop, injury,
  tactical switch, or decisive sequence.
- `statBoard`: 2-4 source-backed numbers such as goals, assists, rebounds,
  possession, shots, KOs, set score, ranking, lap time, prize money, or streak.
- `timeline`: match minutes, rounds, sets, race stages, transfer timeline, or
  disciplinary sequence.
- `quote`: coach/player/fighter/organizer/source quote. Do not invent quotes.
- `fixture`: next opponent, rematch, upcoming race, schedule, venue, or bracket.
- `closing`: meaning for standings, title race, next round, qualification, or
  what to watch next.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Keep other headlines to 2-4 lines.
- Put exact phrases to become accent-colored in `accentWords`.
- Avoid mocking, insult, certainty-heavy rumor phrasing, and exaggerated blame.

Copy rules:

- `section` is a short uppercase label such as `FOOTBALL`, `BASKETBALL`,
  `MMA`, `BOXING`, `TENNIS`, `RACING`, `ESPORTS`, `MATCHDAY`, `TRANSFER`.
- `kicker` is optional and should be short.
- Keep each body field under about 135 Vietnamese characters.
- Use `tags` for compact categories such as `Vòng bảng`, `Derby`, `Chung kết`,
  `Playoffs`, `Knockout`, `Chuyển nhượng`, `BXH`.
- Do not duplicate subtitles in scene text.

Media rules:

- Accept still media: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Accept source video: `.mp4`, `.mov`; render muted and looped.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatar
  thumbnails, and unrelated decorative icons.
- Remote media must be public and CORS-renderable.
- Every media item must include `credit`.
- If no reliable source media exists, omit `media` and use score, stats,
  timeline, quote, or text-led scenes.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { Layout, SportsScene } from '../templates/news/sports-arena-dark';
import type { SportsArenaDarkSpec } from '../templates/news/sports-arena-dark';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as SportsArenaDarkSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout
    slug={slug}
    bgMusic={spec.video.bgMusic ?? null}
    sport={spec.video.sport ?? 'other'}
  >
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            <SportsScene
              {...scene.sports}
              sport={scene.sports.sport ?? spec.video.sport ?? 'other'}
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

- [ ] `templateId` is `"news/sports-arena-dark"`.
- [ ] `video.title` is short and follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- [ ] `video.sport` matches the article.
- [ ] Scores, fixtures, stats, rankings, injuries, penalties, and quotes are
      source-backed.
- [ ] Rumors and transfer talks preserve uncertainty.
- [ ] Each scene has audio-derived timing.
- [ ] All media is from the article or an accessible public source.
- [ ] Every media item has `credit`.
- [ ] Videos are muted and looped.
- [ ] `totalFrames` equals the last scene end frame.
