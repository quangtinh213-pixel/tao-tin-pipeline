# news/auto-market-light

Fixed light editorial template for Vietnamese automotive market news. It is not
only for vehicle introductions: use it for market shifts, EV adoption,
launches, discontinued models, pricing changes, policy impact, consumer
behavior, sales trends, supply chains, and why a category becomes popular.

It is visually distinct from `news/auto-showroom-dark`: instead of cinematic
showroom lighting, it uses a bright market-analysis page with blueprint grid,
data cards, lifecycle timeline, reason blocks, price-shift tables, and buyer
watchlists.

## Input Contract

Use only facts, model names, dates, prices, sales numbers, policy details,
quotes, source credits, and media found in the user context or public article.
Do not fabricate prices, sales figures, discontinued dates, policy incentives,
EV adoption reasons, media URLs, or source attribution.

If the user provides a public article URL:

- Extract title, date, publisher, model names, market context, price changes,
  policy details, sales/share data, quotes, and usable media.
- Accept media only when the URL is public and ends in `.jpg`, `.jpeg`, `.png`,
  `.webp`, `.mp4`, or `.mov`, allowing query strings.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, and animated formats.
- Every media item must include `credit`.

The template must remain strong without media. Prefer metrics, reason cards,
timeline, comparison table, and closing checklist.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Bright paper/blueprint background with thin border and subtle market-map
  circles.
- Editorial automotive-market feel: clean, analytical, and readable.
- Blue means market shift/technology. Green means growth/adoption. Red means
  decline/discontinued. Amber means watch/caution/policy uncertainty.
- Condensed headline typography for fast social-video reading.
- Mono labels for market data, dates, prices, and sections.
- Source media, when present, appears as evidence, not decoration.
- Subtitles sit near the bottom with blue active-word highlight.

## Motion

- Section/dateline rule appears first.
- Headline lines reveal upward.
- Metric/reason/timeline cards stagger in.
- Media reveals left-to-right with a quiet zoom.
- Price-shift rows step in like a market table.
- Avoid dark showroom effects, fake brand logos, sales-brochure language,
  cartoon car motion, or over-styled racing visuals.

## Step 2 Planner Rules

Use a market-news structure:

- `hook`: why this automotive story matters to the market or buyers.
- `segments`: 2-3 factual segments, each centered on one market signal,
  lifecycle event, price move, policy effect, buyer reason, or adoption driver.
- `ending`: what to watch next.
- Estimated duration: 20-35 seconds.

## Step 3 Teller Rules

- Vietnamese, neutral automotive-news tone.
- Explain cause and effect clearly.
- Avoid marketing claims, purchase recommendations, or unsupported predictions.
- For EV popularity stories, separate source-backed reasons from broader
  interpretation.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface AutoMarketLightSpec {
  templateId: "news/auto-market-light";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: "market" | "launch" | "discontinued" | "ev-trend" | "policy" | "pricing" | "consumer" | "sales" | "supply-chain" | "other";
  };
  scenes: Array<{
    type: "autoMarketLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    market: {
      variant: "marketOpening" | "launchBrief" | "discontinuedTimeline" | "evTrendExplainer" | "priceShift" | "policyImpact" | "consumerChoice" | "sourceQuote" | "closingWatchlist";
      topic?: "market" | "launch" | "discontinued" | "ev-trend" | "policy" | "pricing" | "consumer" | "sales" | "supply-chain" | "other";
      tone?: "growth" | "decline" | "shift" | "watch" | "neutral";
      section: string;
      dateline?: string;
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
      metrics?: Array<{ label: string; value: string; note?: string; tone?: "growth" | "decline" | "shift" | "watch" | "neutral" }>;
      reasons?: Array<{ label: string; detail?: string; tone?: "growth" | "decline" | "shift" | "watch" | "neutral" }>;
      timeline?: Array<{ time: string; label: string; detail?: string; tone?: "growth" | "decline" | "shift" | "watch" | "neutral" }>;
      compareRows?: Array<{ label: string; before: string; after: string; tone?: "growth" | "decline" | "shift" | "watch" | "neutral" }>;
      quote?: { text: string; source: string; context?: string };
      checklist?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

For omitted `--audio`, use the registry default
`assets/news/music/nastelbom-soft-music.mp3`. If an audio override disables
music, set `video.bgMusic` to `null`.

## Scene Guidance

Use 6-8 scenes:

- `marketOpening`: first scene. Market-level headline and 2-4 metrics.
- `launchBrief`: new model launch, new brand entry, local market arrival, or
  version update. Use `metrics` and optional media.
- `discontinuedTimeline`: khai tử model, stop sales, end of engine line,
  changing lifecycle. Use `timeline`.
- `evTrendExplainer`: why EVs are becoming popular: cost, policy, charging,
  software, urban use, fleet adoption. Use `reasons`.
- `priceShift`: price cuts, price hikes, incentive changes, old vs new trim,
  before/after market changes. Use `metrics` plus `compareRows`.
- `policyImpact`: registration fees, emissions rules, charging policy,
  subsidies, import duties, or safety regulation. Use `reasons`.
- `consumerChoice`: why buyers shift to SUV/EV/hybrid/used cars/budget cars.
  Use `reasons`.
- `sourceQuote`: official, executive, analyst, dealer, or agency quote.
- `closingWatchlist`: final 3-4 items viewers should monitor next.

Tone rules:

- `growth`: rising sales, adoption, demand, expansion.
- `decline`: discontinued, falling sales, shrinking segment, exit.
- `shift`: structural change, technology migration, new buyer behavior.
- `watch`: uncertainty, policy, supply risk, charging bottleneck, price risk.
- `neutral`: factual context.

Headline rules:

- Use manual line breaks with `\n` when useful.
- Keep headlines to 2-4 short lines.
- Put exact highlighted phrases into `accentWords`.
- Avoid sales slogans and purchase advice.

Media rules:

- Media is optional.
- Use only public, reliable source media.
- Every media item must include `credit`.
