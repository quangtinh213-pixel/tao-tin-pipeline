# news/auto-showroom-dark

Fixed dark showroom template for Vietnamese automotive news generated from a
public article URL or source-backed text. It is designed for car launches,
electric vehicles, price updates, reviews, safety ratings, recalls, market
competition, motorsport-adjacent product news, and technology announcements.

## Input Contract

Use only facts, specs, dates, prices, model names, market names, quotes, source
credits, and media found in the user context or public article. Do not fabricate
car prices, horsepower, range, charging speed, acceleration, safety ratings,
delivery dates, recall counts, media URLs, or source attribution.

If the user provides a public article URL:

- Extract title, date, publisher, model names, prices, market, powertrain,
  range/fuel use, dimensions, safety/recall details, quotes, and usable media.
- Accept media only when the URL is public and ends in `.jpg`, `.jpeg`, `.png`,
  `.webp`, `.mp4`, or `.mov`, allowing query strings.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, and animated formats.
- Every media item must include `credit`.

The template must remain visually strong without media. Use showroom silhouette,
spec cards, gauge, compare board, feature list, recall checklist, and road-ahead
blocks when no valid source image/video exists.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Dark graphite showroom background with subtle grid, floor glow, chrome line,
  and restrained headlight sweep.
- Electric blue is used for EV/technology. Racing red is used for performance
  or urgent market moves. Amber is used for safety, recall, or caution. Chrome
  is neutral.
- Condensed headline typography evokes automotive magazines.
- Mono labels are used for specs: `0-100 km/h`, `620 km`, `408 mã lực`,
  `1,2 tỷ đồng`, `15 phút sạc`.
- Source media appears as a press-kit frame; without media, render a clean car
  silhouette instead of filler imagery.
- Voice subtitles sit near the bottom with electric-blue active word highlight.

## Motion

- Badge appears first.
- Headline lines reveal upward; a headlight sweep passes over the headline.
- Media frame reveals left-to-right with slow showroom zoom.
- Spec cards stagger in.
- Gauge needle animates once for performance/range scenes.
- Compare board and recall items step in with restrained motion.
- Avoid cartoon car effects, excessive racing stripes, meme motion, fake brand
  logos, or fabricated dashboard screenshots.

## Step 2 Planner Rules

Use a tight automotive-news structure:

- `hook`: the clearest news angle, such as launch, price, recall, range, market
  disruption, or technology change.
- `segments`: 2-3 factual segments, each centered on one spec, price, feature,
  comparison, safety issue, or market implication.
- `ending`: what buyers/viewers should monitor next.
- Estimated duration: 20-35 seconds.

## Step 3 Teller Rules

- Vietnamese, neutral automotive-news tone.
- Explain specs in plain language and avoid marketing claims.
- Do not invent test-drive impressions unless the source actually contains
  them.
- Avoid purchase recommendations, guaranteed resale-value claims, or advice
  presented as certainty.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface AutoShowroomDarkSpec {
  templateId: "news/auto-showroom-dark";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: "launch" | "review" | "ev" | "market" | "price" | "safety" | "recall" | "technology" | "motorsport" | "other";
  };
  scenes: Array<{
    type: "autoShowroomDark";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    auto: {
      variant: "showroomOpening" | "priceAndLaunch" | "powertrainSpec" | "designFeature" | "marketPosition" | "safetyRecall" | "sourceQuote" | "roadAhead";
      topic?: "launch" | "review" | "ev" | "market" | "price" | "safety" | "recall" | "technology" | "motorsport" | "other";
      tone?: "electric" | "performance" | "warning" | "neutral";
      badge: string;
      eyebrow?: string;
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
      specs?: Array<{ label: string; value: string; unit?: string; note?: string; tone?: "electric" | "performance" | "warning" | "neutral" }>;
      features?: Array<{ label: string; detail?: string; tone?: "electric" | "performance" | "warning" | "neutral" }>;
      compare?: {
        leftLabel: string;
        rightLabel: string;
        items: Array<{ label: string; left: string; right: string; winner?: "left" | "right" | "tie" }>;
      };
      issues?: Array<{ label: string; detail?: string; tone?: "electric" | "performance" | "warning" | "neutral" }>;
      quote?: { text: string; source: string; context?: string };
      checklist?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

For omitted `--audio`, use the registry default
`assets/news/music/sonican-flash-news.mp3`. If an audio override disables music,
set `video.bgMusic` to `null`.

## Scene Guidance

Use 6-8 scenes:

- `showroomOpening`: opening scene. Big headline, media if available, otherwise
  showroom silhouette.
- `priceAndLaunch`: price, version, order date, delivery date, market, or local
  availability. Use `specs`.
- `powertrainSpec`: engine, motor, battery, range, fuel use, charging,
  acceleration, horsepower, torque. Use `specs`; the first spec drives the
  gauge.
- `designFeature`: exterior, cabin, software, ADAS, charging, infotainment, or
  packaging. Use media plus `features`.
- `marketPosition`: comparison with rivals, segment, old vs new version, or
  price positioning. Use `compare`.
- `safetyRecall`: recalls, defects, safety warnings, crash results, or affected
  model groups. Use `issues`.
- `sourceQuote`: executive, agency, reviewer, or official quote.
- `roadAhead`: final watchlist: price confirmation, delivery timing, warranty,
  charging network, real-world range, recall remedy, or buyer response.

Tone rules:

- `electric`: EV, software, charging, range, autonomy, cabin tech.
- `performance`: speed, power, sport trim, dramatic launch, sales surge.
- `warning`: recall, safety defect, delay, price shock, investigation.
- `neutral`: market context, model-year update, comparison, factual summary.

Headline rules:

- Use manual line breaks with `\n` when useful.
- Keep headlines to 2-4 short lines.
- Put exact highlighted phrases into `accentWords`.
- Avoid fake brand slogans and purchase advice.

Spec rules:

- Keep each `spec.value` short: `620`, `1,2`, `408`, `15`, `7 chỗ`.
- Put units in `unit`: `km`, `tỷ đồng`, `mã lực`, `phút`, `kWh`.
- If a number is approximate in the source, preserve that in `value` or `note`.

Media rules:

- Media is optional.
- Use only public, reliable source media.
- Every media item must include `credit`.
