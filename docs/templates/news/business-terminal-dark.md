# news/business-terminal-dark

Fixed dark market-terminal template for Vietnamese business news generated from
a public article URL or source-backed text. It is designed for stock markets,
company earnings, commodities, banking, interest rates, inflation, exchange
rates, trade, real-economy data, and economic policy.

## Input Contract

Use only facts, numbers, company names, prices, dates, quotes, source credits,
and media found in the user context or public article. Do not fabricate market
prices, percentage moves, forecasts, image URLs, company guidance, analyst
quotes, or source attribution.

If a public article URL is provided:

- Extract title, publication date, publisher, key numbers, quotes, market
  instruments, company names, and usable media URLs.
- Accept media only when the URL is public and ends in `.jpg`, `.jpeg`, `.png`,
  `.webp`, `.mp4`, or `.mov`, allowing query strings.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, and animated formats.
- Every media item must include `credit`.

This template must remain visually strong without images. Prefer data panels,
line charts, ticker strips, risk lists, and tables over decorative media.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- No top bar. The frame opens directly into a dark terminal background.
- Background uses graphite/near-black gradients, subtle financial grid, and
  restrained corner glow.
- Panels use sharp market-terminal styling: thin borders, low radius, dark
  translucent surfaces, mono labels, and no soft news cards.
- Green means positive/up/growth. Red means down/pressure/loss. Amber means
  warning or macro emphasis. Cyan means neutral/watch.
- Headline uses condensed Vietnamese-safe sans; values, tickers, and tables use
  mono typography.
- Voice subtitles render near the bottom with amber active word highlight.

## Motion

- Market label fades/slides in first.
- Headline lines reveal upward in sequence.
- Ticker strip moves slowly and continuously.
- Metric panels stagger in.
- Line chart draws across the panel.
- Media, when present, reveals left to right and slowly scales down.
- Avoid meme motion, glitch overload, crypto-neon effects, aggressive bounce,
  or fake trading-screen clutter.

## Step 2 Planner Rules

Use a tight market-news structure:

- `hook`: why this market/business story matters now.
- `segments`: 2-3 key facts, each centered on one number, company, policy move,
  price move, or risk.
- `ending`: what viewers should monitor next.
- Estimated duration: 20-35 seconds.

## Step 3 Teller Rules

- Vietnamese, neutral financial-news tone.
- Explain numbers in plain language. Do not give investment advice.
- Separate fact, implication, and uncertainty.
- Avoid promises such as "nên mua", "chắc chắn tăng", or guaranteed returns.

## Step 6 Output

Write `videos/<slug>/spec.json` as:

```ts
interface BusinessTerminalDarkSpec {
  templateId: "news/business-terminal-dark";
  slug: string;
  totalFrames: number;
  video: {
    title: string;
    date: string;
    articleUrl?: string;
    publisher?: string;
    bgMusic?: string | null;
    topic?: "markets" | "stocks" | "commodities" | "macro" | "banking" | "earnings" | "real-economy" | "policy" | "other";
  };
  scenes: Array<{
    type: "businessTerminalDark";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    business: {
      variant: "marketOpening" | "indexMove" | "commodityPrice" | "macroSignal" | "companyEarnings" | "riskWatch" | "sourceQuote" | "closingOutlook";
      topic?: "markets" | "stocks" | "commodities" | "macro" | "banking" | "earnings" | "real-economy" | "policy" | "other";
      tone?: "up" | "down" | "neutral" | "warning";
      section: string;
      eyebrow?: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      body2?: string;
      ticker?: Array<{ symbol: string; value?: string; change?: string; tone?: "up" | "down" | "neutral" | "warning" }>;
      metrics?: Array<{ label: string; value: string; change?: string; note?: string; tone?: "up" | "down" | "neutral" | "warning" }>;
      chart?: Array<{ label: string; value: number }>;
      table?: Array<{ label: string; value: string; change?: string; tone?: "up" | "down" | "neutral" | "warning" }>;
      risks?: Array<{ label: string; detail?: string; tone?: "up" | "down" | "neutral" | "warning" }>;
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
      outlook?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

For omitted `--audio`, use the registry default
`assets/news/music/news-ambient-01.mp3`. If an audio override disables music,
set `video.bgMusic` to `null`.

## Scene Guidance

Use 6-8 scenes for a typical video:

- `marketOpening`: first scene. Big headline, short body, and `ticker` with
  3-6 relevant instruments such as `VNINDEX`, `S&P 500`, `USD/VND`, `GOLD`,
  `BRENT`, company ticker, commodity, or interest-rate label.
- `indexMove`: stock-index or market-breadth move. Use one main metric, optional
  2-4 metrics, and a `chart`.
- `commodityPrice`: gold, oil, rice, coffee, steel, gas, shipping, or other
  commodity. Use price, change, and cause.
- `macroSignal`: GDP, CPI, rates, FX, PMI, trade, employment, credit growth,
  or policy data. Use metrics plus table or chart.
- `companyEarnings`: revenue, profit, margin, debt, orders, sales, or share
  move. Use metrics and table.
- `riskWatch`: what can change the story next. Use 2-4 `risks`.
- `sourceQuote`: use for a strong official, executive, analyst, or agency
  quote from the source.
- `closingOutlook`: final scene. Use 3-4 `outlook` items and optional hashtags.

Headline rules:

- Use manual line breaks with `\n` when helpful.
- Keep headlines to 2-4 short lines.
- Put exact highlighted phrases into `accentWords`.
- Avoid investment recommendations and guaranteed forecasts.

Metric rules:

- Use `tone: "up"` only when higher is positive in context.
- Use `tone: "down"` when the move is negative or pressure.
- Use `tone: "warning"` for inflation, risk, uncertainty, rates, costs, or
  fragile signals.
- Use `tone: "neutral"` for context metrics.

Chart rules:

- `chart.value` is relative and may use indexed values when the article only
  gives direction. Do not invent exact market prices.
- Use 4-7 points with short labels.
- If no numeric sequence exists, omit `chart`.

Media rules:

- Media is optional and never required.
- Use article images/videos only when public and reliable.
- Every media item must include `credit`.
- For charts from articles, set `mediaType: "INFOGRAPHIC"` only when the source
  image is actually an infographic.
