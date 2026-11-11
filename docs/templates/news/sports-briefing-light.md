# news/sports-briefing-light

Fixed light editorial template for Vietnamese sports news generated from a
public article URL or source-backed text. It is designed for football,
basketball, boxing, MMA, tennis, racing, esports, match reports, previews,
standings, transfer updates, rankings, and athlete stories.

## Input Contract

Use only facts, images, videos, dates, credits, scores, rankings, fixtures,
quotes, injuries, penalties, venues, records, and attribution available from
the supplied article or public source media. Do not fabricate source media,
final scores, scorers, cards, fight results, statistics, rankings, schedules,
injury details, transfer fees, suspensions, or quotes.

Prefer this template when the story needs a clear, readable, newsy sports
briefing rather than a dark arena/high-energy look.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Light sports desk look: warm paper background, subtle grid, fixed red accent,
  navy text, clean scoreboards, stat cards, timeline rows, and source media.
- The palette does not change by sport. `sport` is editorial metadata only.
- Typography uses `Roboto Condensed` for headlines/scoreboards and `Inter` for
  body, labels, captions, stats, and subtitles.
- Source images/videos are rendered as evidence cards with visible attribution:
  `Nguồn: <credit>`.
- Source video is muted and looped.
- Voice subtitles sit near the bottom, with the active spoken word in red.

## Editorial Safety Rules

- Keep an energetic but factual Vietnamese sports-news tone.
- Do not present rumors, transfer talks, injuries, suspensions, doping issues,
  or disciplinary cases as confirmed unless the source confirms them.
- Attribute quotes to the player, coach, fighter, club, league, organizer, or
  outlet named by the source.
- Distinguish official score, reported claim, preview prediction, ranking,
  coach opinion, fan reaction, and rumor.
- Never invent match statistics or fixtures just to fill a stat board.

## Spec Schema

Use the same scene shape as `news/sports-arena-dark`, with:

```ts
interface SportsBriefingLightSpec {
  templateId: "news/sports-briefing-light";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    sport?: "football" | "basketball" | "mma" | "boxing" | "tennis" | "racing" | "esports" | "other";
    competition?: string;
    venue?: string;
    matchDate?: string;
  };
  scenes: Array<{
    type: "sportsBriefingLight";
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
      sport?: string;
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
      score?: { home: string; away: string; homeScore?: string; awayScore?: string; status?: string; note?: string };
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
  "templateId": "news/sports-briefing-light",
  "slug": "<slug>",
  "totalFrames": 1200,
  "video": {
    "title": "<Vietnamese title - max 8 words>",
    "date": "<DD/MM/YYYY>",
    "sport": "football",
    "competition": "<league/tournament if known>",
    "bgMusic": "assets/news/music/nastelbom-soft-music.mp3"
  },
  "scenes": []
}
```

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
- `statBoard`: 2-4 source-backed numbers.
- `timeline`: match minutes, rounds, sets, race stages, transfer timeline, or
  disciplinary sequence.
- `quote`: coach/player/fighter/organizer/source quote. Do not invent quotes.
- `fixture`: next opponent, rematch, upcoming race, schedule, venue, or bracket.
- `closing`: meaning for standings, title race, next round, qualification, or
  what to watch next.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import { Layout, SportsBriefingScene } from '../templates/news/sports-briefing-light';
import type { SportsBriefingLightSpec } from '../templates/news/sports-briefing-light';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as SportsBriefingLightSpec;

export const VideoContent: React.FC<{ slug: string }> = ({ slug }) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationFrames} premountFor={30}>
            <SportsBriefingScene {...scene.sports} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

## Checklist

- [ ] `templateId` is `"news/sports-briefing-light"`.
- [ ] Palette stays light with fixed red accent; do not change color by sport.
- [ ] `video.title` is short and follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- [ ] Scores, fixtures, stats, rankings, injuries, penalties, and quotes are
      source-backed.
- [ ] Each scene has audio-derived timing.
- [ ] All media is from the article or an accessible public source.
- [ ] Every media item has `credit`.
- [ ] Videos are muted and looped.
- [ ] `totalFrames` equals the last scene end frame.
