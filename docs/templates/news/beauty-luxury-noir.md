# news/beauty-luxury-noir

Fixed luxury-dark template for Vietnamese beauty knowledge generated from
user-written context or a public article URL. It covers skincare, cosmetics,
ingredients, routines, beauty trends, product news, and source-backed aesthetic
procedure explainers.

## Input Contract

Accept either user-written/source text or a public article URL. Use only facts,
claims, quotes, figures, risks, outcomes, dates, and media supplied by the user
or accessible from the source. If no reliable media exists, use text-led
ingredient, ritual, metric, comparison, quote, and safety scenes.

Do not fabricate clinical outcomes, expert statements, before/after media,
contraindications, product efficacy, prices, procedure downtime, or result
duration. Distinguish brand/clinic claims from reporting, expert opinion, and
study findings. Preserve uncertainty and individual variability.

## Visual System

- 1080x1920, 9:16, 30fps.
- Luxury noir aesthetic: espresso and deep plum canvas, champagne-gold foil,
  pearl typography, dusty-rose highlights, silk-like curves, and restrained
  luminous particles.
- `Newsreader` renders elegant editorial headlines and quotes; `Inter` renders
  labels, body, data, captions, and subtitles.
- Source media uses tall arched frames with muted saturation, gold hairlines,
  dark lower gradients, and visible attribution.
- Information appears on refined translucent glass surfaces rather than bright
  dashboard cards.
- Ingredient blocks resemble a cosmetic display shelf. Routine steps resemble
  a jewelry or ritual timeline. Metrics use gold/rose foil panels.
- Motion is slow and composed: soft rise, silk drift, subtle media zoom, and
  ordered stagger. No bounce, flash, sparkle shower, or aggressive face zoom.
- Subtitle active words use champagne gold in a protected bottom safe zone.

## Beauty Safety Rules

- Do not diagnose, prescribe, guarantee outcomes, or turn promotional claims
  into medical facts.
- Never generate or cosmetically alter before/after evidence.
- Attribute claims, quotes, recommendations, rankings, studies, and statistics.
- Preserve source warnings, contraindications, adverse effects, recovery advice,
  and instructions to seek qualified care.
- Avoid age, skin tone, facial feature, acne, scarring, or body shaming.
- Do not add a hard-sell clinic CTA unless explicitly requested for branded
  promotional content.

## Step 6 Spec

```ts
interface BeautyLuxuryNoirSpec {
  templateId: "news/beauty-luxury-noir";
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
    type: "beautyLuxuryNoir";
    startFrame: number;
    durationFrames: number;
    audioSegment: {start: number; end: number; text: string};
    beauty: {
      variant:
        | "beautyOpening"
        | "productFocus"
        | "ingredientDecode"
        | "routineSteps"
        | "beforeAfterEvidence"
        | "treatmentTimeline"
        | "benefitRisk"
        | "expertQuote"
        | "mythFact"
        | "trendBoard"
        | "safetyAlert"
        | "beautyClosing";
      category:
        | "skincare"
        | "makeup"
        | "hair"
        | "nails"
        | "cosmetic-procedure"
        | "wellness"
        | "beauty-trend"
        | "product-news";
      section: string;
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
        mediaType?: "ẢNH" | "VIDEO" | "SẢN PHẨM" | "CHÂN DUNG" | "MINH HỌA";
      };
      gallery?: Array<{
        src: string;
        storage?: "local" | "remote";
        credit: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
        mediaType?: "ẢNH" | "VIDEO" | "SẢN PHẨM" | "CHÂN DUNG" | "MINH HỌA";
      }>;
      mediaHeight?: number;
      ingredients?: Array<{name: string; role: string; note?: string; tone?: "rose" | "sage" | "clinical" | "neutral"}>;
      steps?: Array<{label: string; detail?: string; meta?: string}>;
      metrics?: Array<{label: string; value: string; note?: string; tone?: "rose" | "sage" | "clinical" | "warning"}>;
      comparison?: Array<{label: string; value: string; detail?: string; tone?: "benefit" | "risk" | "neutral"}>;
      quote?: {text: string; source: string; context?: string};
      cautions?: string[];
      sourceNote?: string;
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

Set `video.bgMusic` to
`"assets/news/music/nastelbom-soft-music.mp3"` unless the resolved audio mode
overrides it. Use audio-derived timing from the common pipeline.

## Scene Guidance

Use 4-6 scenes for 20-35 seconds. Scene meanings match their names:

- `beautyOpening`: premium editorial hook and strongest source media.
- `productFocus`: product/device source media plus disclosed facts.
- `ingredientDecode`: up to four ingredient roles and cautions.
- `routineSteps`: 3-5 ordered skincare, hair, makeup, or aftercare actions.
- `beforeAfterEvidence`: source-backed comparison only; never synthesize it.
- `treatmentTimeline`: consultation, procedure, recovery, and review milestones.
- `benefitRisk`: balanced benefit and consideration cards.
- `expertQuote`: attributed expert, institution, or source statement.
- `mythFact`: source-backed claim and clarification.
- `trendBoard`: up to three attributed beauty visuals.
- `safetyAlert`: 2-4 sourced warnings or contraindications.
- `beautyClosing`: concise takeaways and a soft editorial CTA.

Use manual `\n` headline breaks. Put exact gold-italic phrases into
`accentWords`. Keep body fields under about 135 Vietnamese characters and do
not repeat subtitle text.

## Step 7 Coder

```tsx
import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {Layout, LuxuryBeautyScene} from '../templates/news/beauty-luxury-noir';
import type {BeautyLuxuryNoirSpec} from '../templates/news/beauty-luxury-noir';

<Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
  <Audio src={staticFile(`${slug}/voice.mp3`)} />
  <AbsoluteFill>
    <Series>
      {spec.scenes.map((scene, index) => (
        <Series.Sequence key={index} durationInFrames={scene.durationFrames} premountFor={30}>
          <LuxuryBeautyScene {...scene.beauty} durationFrames={scene.durationFrames} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
</Layout>
```

Do not change the noir palette, typography, arched media language, glass
surfaces, or motion style per video.

## Checklist

- [ ] Template ID and every scene type use `news/beauty-luxury-noir` contract.
- [ ] Scene timings are audio-derived and sum to `totalFrames`.
- [ ] Every source media item has visible credit; video is muted and looped.
- [ ] Claims, evidence, outcomes, quotes, and safety guidance are attributed.
- [ ] No invented before/after, clinical result, expert, or contraindication.
- [ ] Scene content remains outside the subtitle safe zone.
