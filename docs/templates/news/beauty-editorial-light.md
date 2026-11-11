# news/beauty-editorial-light

Fixed light editorial template for Vietnamese beauty and aesthetic news generated
from user-written context or a public article URL. It covers skincare, makeup,
hair, nails, cosmetic products, non-surgical procedures, beauty trends, and
source-backed aesthetic guidance.

## Input Contract

Accept either:

- source text written or pasted by the user; or
- a public article URL with accessible text and optional source media.

For user-written context, do not add medical efficacy claims, figures, expert
quotes, contraindications, or before/after outcomes that were not supplied. A
video without source media must use typography, ingredient cards, routine rails,
metrics, comparisons, and editorial shapes instead of invented evidence.

For a public URL, use only facts, images, videos, dates, product claims, quotes,
study findings, procedure details, and attribution available from the supplied
article or its accessible public media. Preserve the distinction between:

- a brand or clinic claim;
- an expert opinion;
- a study finding;
- editorial reporting;
- personal experience or social-media discussion.

Prefer this template for:

- skincare ingredients, routines, product launches, and product comparisons;
- makeup, hair, nails, beauty trends, and fashion-adjacent beauty stories;
- cosmetic treatment explainers, recovery timelines, risks, and expectations;
- expert interviews, myth/fact explainers, and source-backed safety guidance.

Use a general health template when diagnosis, disease treatment, hospital care,
or public-health risk is the story's main subject.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Premium beauty magazine aesthetic: warm ivory paper, blush washes, rose and
  wine accents, restrained champagne details, sage safety cues, and clinical
  blue evidence cues.
- `Newsreader` renders editorial headlines and quotes. `Inter` renders body,
  labels, data, captions, and subtitles. Both load Vietnamese subsets.
- The background uses organic blush veils, botanical line art, serum-like
  bubbles, soft contour rings, and broad negative space. It must not look like
  a generic news grid or a pink spa advertisement.
- Cards use soft glass-paper surfaces, asymmetric organic radii, and restrained
  shadows. Routine markers resemble droplets or pearls; product media uses an
  arched editorial frame with a subtle cosmetic-display pedestal.
- Source portraits, products, close-up skin images, and procedure media use soft
  editorial frames with visible `Nguồn: <credit>` attribution.
- Source video is muted and looped.
- Voice subtitles occupy the reserved bottom zone; the active word is rose.
- Do not add sparkles, fast zooms into faces, aggressive beauty filters, or
  animations that alter the appearance of a person in source media.

## Beauty And Aesthetic Safety Rules

- Do not diagnose, prescribe, guarantee results, or present cosmetic marketing
  as established medical evidence.
- Never fabricate study numbers, dermatologist statements, clinical outcomes,
  contraindications, prices, treatment duration, downtime, or longevity.
- Never synthesize a before/after comparison when the source does not provide
  one. Text-only expectation/reality comparisons are allowed when source-backed.
- Attribute product efficacy claims to the brand, article, study, expert, or
  institution that made them.
- Preserve uncertainty and individual variability. For treatment outcomes,
  include a source-backed notice such as `Kết quả có thể khác nhau tùy cơ địa`
  when applicable.
- Keep contraindications, recovery guidance, adverse effects, and instructions
  to seek qualified care when they appear in the source.
- Do not shame age, skin tone, facial features, body shape, acne, scarring, or
  other appearance traits.
- Avoid hard-sell clinic calls to action unless the input is explicitly branded
  promotional content and the user requests it.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface BeautyEditorialLightSpec {
  templateId: "news/beauty-editorial-light";
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
    type: "beautyEditorialLight";
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
      ingredients?: Array<{
        name: string;
        role: string;
        note?: string;
        tone?: "rose" | "sage" | "clinical" | "neutral";
      }>;
      steps?: Array<{label: string; detail?: string; meta?: string}>;
      metrics?: Array<{
        label: string;
        value: string;
        note?: string;
        tone?: "rose" | "sage" | "clinical" | "warning";
      }>;
      comparison?: Array<{
        label: string;
        value: string;
        detail?: string;
        tone?: "benefit" | "risk" | "neutral";
      }>;
      quote?: {text: string; source: string; context?: string};
      cautions?: string[];
      sourceNote?: string;
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
  "templateId": "news/beauty-editorial-light",
  "slug": "<slug>",
  "totalFrames": 1350,
  "video": {
    "title": "<Vietnamese title - max 8 words>",
    "date": "<DD/MM/YYYY>",
    "bgMusic": "assets/news/music/nastelbom-soft-music.mp3"
  },
  "scenes": []
}
```

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract. Scene timing must
come from `timeline.json`, and scene durations must sum to `totalFrames`.

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `beautyOpening`: strongest factual hook with an optional portrait, product, or
  article image. Use a 3-5-line headline and a short source-led body.
- `productFocus`: product, device, technique, or launch. Use media and up to four
  metrics for price, format, disclosed ingredients, date, or sourced claims.
- `ingredientDecode`: explain up to four ingredients. `role` states the sourced
  function; `note` carries compatibility, frequency, or caution context.
- `routineSteps`: a 3-5-step skincare, hair, makeup, or aftercare sequence.
- `beforeAfterEvidence`: only when the source supplies comparison evidence or a
  factual time-based result. Use media/metrics and state individual variability.
- `treatmentTimeline`: consultation, procedure, recovery, review, or result
  milestones. Never invent downtime or result duration.
- `benefitRisk`: balanced sourced benefits and considerations. Set each item's
  `tone` to `benefit`, `risk`, or `neutral`.
- `expertQuote`: direct or faithfully summarized attributed expert/source quote.
- `mythFact`: two or four source-backed comparison cards. The first card is the
  myth/claim; the second is the factual clarification.
- `trendBoard`: up to three attributed images or videos for makeup, hair, nails,
  product, or aesthetic trends.
- `safetyAlert`: 2-4 contraindications, warning signs, or actions supported by
  the source. Use `sourceNote` for attribution and uncertainty.
- `beautyClosing`: 2-4 sourced takeaways and a soft editorial CTA.

Copy rules:

- Use manual `\n` line breaks in `headline`.
- `section` is a short uppercase label such as `SKINCARE`, `THẨM MỸ`, `MAKEUP`,
  `HAIR`, `NAILS`, `THÀNH PHẦN`, `AN TOÀN`, or `XU HƯỚNG`.
- Put exact headline phrases to render in rose italic into `accentWords`.
- Keep each body field under about 135 Vietnamese characters.
- Scene body adds context and must not repeat the voice subtitle.
- Keep cards concise: one fact hierarchy per card, no paragraph walls.

Media rules:

- Accept `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, and `.mov`.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatars, and
  unrelated decorative media.
- Remote media must be public and CORS-renderable.
- Every media item requires `credit`.
- Do not apply filters that materially change skin tone, facial structure, body
  shape, or treatment result.
- When reliable media is unavailable, omit it and prefer ingredient, routine,
  metric, comparison, quote, or safety scenes.

## Step 7 Coder

Use the fixed components:

```tsx
import React from 'react';
import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import {BeautyScene, Layout} from '../templates/news/beauty-editorial-light';
import type {BeautyEditorialLightSpec} from '../templates/news/beauty-editorial-light';
import specData from '../../videos/<slug>/spec.json';

const spec = specData as BeautyEditorialLightSpec;

export const VideoContent: React.FC<{slug: string}> = ({slug}) => (
  <Layout slug={slug} bgMusic={spec.video.bgMusic ?? null}>
    <Audio src={staticFile(`${slug}/voice.mp3`)} />
    <AbsoluteFill>
      <Series>
        {spec.scenes.map((scene, index) => (
          <Series.Sequence key={index} durationInFrames={scene.durationFrames} premountFor={30}>
            <BeautyScene {...scene.beauty} durationFrames={scene.durationFrames} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  </Layout>
);
```

Do not change the fixed palette, typography, background, subtitle zone, or
animation language per video.

## Checklist

- [ ] `templateId` is `"news/beauty-editorial-light"`.
- [ ] Input is user-written context or an accessible public article URL.
- [ ] `video.bgMusic` uses the registry default unless audio mode overrides it.
- [ ] Every scene has audio-derived timing.
- [ ] Source media has visible credit and source video is muted.
- [ ] Product/clinic claims remain attributed rather than stated as certainty.
- [ ] No fabricated expert quote, clinical figure, before/after, risk, or result.
- [ ] Safety and uncertainty language from the source is preserved.
- [ ] Scene text does not duplicate subtitles.
- [ ] `totalFrames` equals the final scene end frame.
