# news/business-ledger-light

Fixed light editorial template for Vietnamese business and finance news. It is
visually distinct from `news/business-terminal-dark`: instead of a dark trading
terminal, it uses a warm financial-newspaper page, serif headlines, ledger
tables, memo cards, and annual-report style metrics.

Use it for stock-market summaries, company earnings, commodities, inflation,
trade, banking, consumer spending, policy impact, and real-economy explainers
where the desired tone is calm, premium, and readable.

## Input Contract

Use only facts, figures, dates, companies, quotes, source credits, and media
found in the user context or public article. Do not fabricate prices,
percentage changes, forecasts, analyst quotes, media URLs, or source
attribution.

If the user provides a public article URL:

- Extract title, date, publisher, key numbers, quoted sources, company names,
  markets, commodities, and media URLs.
- Accept media only when the URL is public and ends in `.jpg`, `.jpeg`, `.png`,
  `.webp`, `.mp4`, or `.mov`, allowing query strings.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, and animated formats.
- Every media item must include `credit`.

The template should work without images. Prefer ledger tables, metrics,
timeline, memo cards, and checklist blocks.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Warm paper background, thin page border, subtle ledger grid.
- Serif Vietnamese-safe headlines with restrained red/gold/green/blue accents.
- Metrics use a mix of serif numbers and mono labels.
- Tables look like a business newspaper ledger, not an app dashboard.
- Source media appears as a lightly rotated newspaper clipping.
- Subtitles sit near the bottom with red active-word highlight.

## Motion

- Section/dateline rule appears first.
- Headline lines reveal upward one by one.
- Metric cards and ledger rows stagger in.
- Media clips rotate gently into place.
- Timeline/checklist items step in with restrained editorial motion.
- Avoid dark terminal visuals, neon effects, crypto-style UI, glitch, bounce, or
  playful stickers.

## Step 2 Planner Rules

Use a clear business-news structure:

- `hook`: the most important business implication.
- `segments`: 2-3 factual segments, each centered on one number, company,
  commodity, consumer signal, policy move, or risk.
- `ending`: what to watch next.
- Estimated duration: 20-35 seconds.

## Step 3 Teller Rules

- Vietnamese, neutral business-news tone.
- Explain what the number means; do not give investment advice.
- Separate fact from interpretation and uncertainty.
- Avoid guaranteed forecasts or direct buy/sell language.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface BusinessLedgerLightSpec {
  templateId: "news/business-ledger-light";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: "markets" | "stocks" | "commodities" | "macro" | "banking" | "earnings" | "trade" | "consumer" | "policy" | "other";
  };
  scenes: Array<{
    type: "businessLedgerLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    ledger: {
      variant: "frontPage" | "marketLedger" | "macroMemo" | "companySheet" | "commodityNotebook" | "policyImpact" | "quoteColumn" | "closingBrief";
      topic?: "markets" | "stocks" | "commodities" | "macro" | "banking" | "earnings" | "trade" | "consumer" | "policy" | "other";
      tone?: "gain" | "loss" | "watch" | "neutral";
      section: string;
      dateline?: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      body2?: string;
      metrics?: Array<{ label: string; value: string; note?: string; tone?: "gain" | "loss" | "watch" | "neutral" }>;
      rows?: Array<{ label: string; value: string; note?: string; tone?: "gain" | "loss" | "watch" | "neutral" }>;
      timeline?: Array<{ time: string; label: string; detail?: string }>;
      quote?: { text: string; source: string; context?: string };
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

- `frontPage`: opening newspaper-style headline with 2-4 key metrics.
- `marketLedger`: market or index summary with metrics and `rows`.
- `macroMemo`: inflation, GDP, interest rates, FX, trade, jobs, PMI, credit, or
  consumer data with rows.
- `companySheet`: company earnings, revenue, margin, debt, orders, or share
  movement with metrics and rows.
- `commodityNotebook`: gold, oil, coffee, rice, steel, shipping, or gas with
  price metrics and cause/effect rows.
- `policyImpact`: policy timeline or sequence of economic effects.
- `quoteColumn`: strong sourced quote.
- `closingBrief`: final watchlist using `checklist`.

Tone rules:

- `gain`: positive market/business move.
- `loss`: negative result, pressure, decline, or loss.
- `watch`: uncertainty, inflation, cost pressure, rates, supply risk, or policy
  watch.
- `neutral`: explanatory context.

Headline rules:

- Use manual line breaks with `\n` when useful.
- Keep headlines to 2-4 short lines.
- Put exact highlighted phrases into `accentWords`.
- Do not write buy/sell recommendations.

Media rules:

- Media is optional.
- Use only public, reliable source media.
- Every media item must include `credit`.
