# news/travel-guide-light

Fixed template for practical Vietnamese travel-guide videos. It is more useful
and checklist-driven than `news/travel-postcard-light`: use it when the story
needs budget, route, timing, packing, booking, safety, or local advice.

## Input Contract

Use public article facts only. If the context includes a public URL, use only
facts, images, dates, prices, schedules, rules, credits, and attribution
available from that URL or its accessible media. Do not fabricate prices,
booking windows, routes, travel restrictions, opening hours, weather warnings,
or local advice.

Prefer this template when the article is about:

- how to visit a destination;
- weekend itinerary, food crawl, festival guide, or transport route;
- travel cost, timing, ticket price, flight/train duration, hotel booking, or
  crowd level;
- practical dos/don'ts, checklist, seasonality, packing, safety, or local
  etiquette.

Do not use it for purely inspirational photo essays, luxury real-estate
features, serious incidents, or market-investment tourism analysis.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Clean light guide background with subtle grid and green/blue/coral accents.
- Typography is `Be Vietnam Pro`, dense but readable.
- Panels look like travel app cards and itinerary boards, not postcards.
- Source images are optional and appear in clean rounded guide cards with
  credit.
- Subtitles sit near the bottom, with active spoken words in blue.

## Motion

Use practical, quick-read motion:

- Meta and headline reveal first.
- Guide cards rise in with short stagger.
- Budget metric appears as one dominant card.
- Timeline/itinerary rows reveal top to bottom.
- Checklist items reveal one by one.
- Avoid cinematic moodiness, luxury magazine styling, cartoon travel icons,
  neon, glitch, and excessive decorative motion.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface TravelGuideLightSpec {
  templateId: "news/travel-guide-light";
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
    type: "travelGuideLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    guide: {
      variant: "opening" | "budget" | "itinerary" | "checklist" | "dosDonts" | "season" | "closing";
      meta: string;
      destination?: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      image?: {
        src: string;
        storage?: "local" | "remote";
        credit?: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
      };
      imageHeight?: number;
      metric?: { label: string; value: string; unit?: string; note?: string };
      items?: Array<{ label: string; text: string; tone?: "neutral" | "good" | "warn" | "avoid" }>;
      avoidItems?: Array<{ label: string; text: string; tone?: "neutral" | "good" | "warn" | "avoid" }>;
      schedule?: Array<{ time: string; title: string; detail?: string }>;
      tags?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Scene Guidance

Use 6-8 scenes for a 45-75 second video.

- `opening`: practical guide hook with optional destination image.
- `budget`: one cost, duration, ticket, occupancy, distance, or passenger metric.
- `itinerary`: 3-5 stops or time blocks.
- `checklist`: what to prepare, book, bring, verify, or avoid forgetting.
- `dosDonts`: split recommended and avoided actions using `items` and
  `avoidItems`.
- `season`: weather, crowd, festival, booking, or best-time-to-go context with
  optional image.
- `closing`: final save/share CTA or next-step reminder.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Put key words to become blue in `accentWords`.
- Keep non-opening headlines to 2-4 lines.

Body rules:

- Keep each body field under about 150 Vietnamese characters.
- Do not repeat the voice subtitle verbatim.
- Use `tags` for compact labels such as `CHI PHÍ`, `LỊCH TRÌNH`, `MÙA ĐẸP`,
  `ĐẶT SỚM`, `GIA ĐÌNH`, `CUỐI TUẦN`.

Media rules:

- Use `<Img>` compatible still images only: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Remote images must be public and CORS-renderable.
- Never use `.gif`, `.svg`, `.avif`, or decorative/fabricated image URLs.
- Include image credit whenever available.
- If no reliable image exists, use guide cards, metric, itinerary, checklist,
  or closing variants rather than inventing media.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer a soft practical travel/editorial bed from
  `public/assets/news/manifest.json`, especially
  `miromaxmusic-music-promotion` or `nastelbom-soft-music`.
