# news/real-estate-civic-dark

Fixed template for objective Vietnamese real-estate civic news generated from a
public article URL. It shares the civic real-estate schema with the light
version, but uses a darker urban planning visual language for legal tension,
resident-impact stories, and unresolved policy decisions.

## Input Contract

The context must include a public article URL. Use only facts, images, dates,
credits, quotes, and attribution that can be found in that article or its
publicly accessible media. Do not fabricate image URLs, source credits, legal
references, people names, dates, or figures.

Prefer this template when the article is about:

- social housing, resettlement, tenant/rent obligations, resident petitions;
- planning or real-estate policy with direct household impact;
- legal or administrative decisions affecting home ownership, lease, or
  compensation;
- local-government response to a civic housing issue.

Do not use it for luxury project marketing, generic market commentary, or
infrastructure-first stories where a map/route template would be clearer.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Dark civic planning look: near-black urban background, cadastral grid,
  amber legal accent, cyan map/evidence accent.
- Typography uses `Roboto Condensed` for heavy headlines, `Inter` for
  body/subtitles, and `Roboto` for compact meta/captions.
- Text remains top-left editorial, but with sharper dossier-like blocks,
  thin rules, and restrained high-contrast hierarchy.
- Source captions sit immediately under images as `Ảnh: <credit>`.
- Voice subtitles sit near the bottom in gray, with the active spoken word in
  warm white.

## Motion

Use restrained investigative-editorial motion:

- Meta label fades/slides in first as a dossier tag.
- Headline lines reveal one by one with staggered upward motion.
- Body/timeline/quote elements reveal after the headline.
- Images reveal inside a clipped frame:
  - opening, stat, and closing scenes open from the center to both sides;
  - other image scenes open from left to right;
  - a narrow amber scan line passes across the reveal.
- Images continue a very slow inward crop from about `1.12` scale to `1.03`.
- Quote left rule draws vertically.
- Avoid bouncy, playful, meme, glitch, or aggressive breaking-news motion.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface RealEstateCivicDarkSpec {
  templateId: "news/real-estate-civic-dark";
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
    type: "civic";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    civic: {
      variant:
        | "opening"
        | "timeline"
        | "legal"
        | "stat"
        | "text"
        | "chips"
        | "quote"
        | "closing";
      meta: string;
      headline: string;
      body?: string;
      body2?: string;
      highlightWords?: string[];
      image?: {
        src: string;
        storage?: "local" | "remote";
        credit: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
      };
      imageHeight?: number;
      timeline?: Array<{ label: string; text: string }>;
      chips?: string[];
      quote?: { text: string; attribution: string };
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Scene Guidance

Use 6-8 scenes for a typical 45-70 second video.

- `opening`: article hook with main number/headline and main image.
- `timeline`: why it happened, usually 3 dated milestones.
- `legal`: regulation or policy basis, with one highlighted legal conclusion.
- `stat`: scale of the issue, using a large number and image.
- `text`: resident voice or explanatory scene without image.
- `chips`: accumulated unresolved issue, with 2-4 status chips.
- `quote`: official response or article quote.
- `closing`: unresolved state, follow-up point, optional final image.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Keep other headlines to 2-4 lines.
- Do not use sales language or investment promises.

Body rules:

- Keep each body field under about 130 Vietnamese characters.
- Use `highlightWords` only for facts that need emphasis.
- Do not put subtitles into scene text; subtitles are generated from
  `timeline.json`.

Media rules:

- Use `<Img>` compatible still images only: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Remote images must be public and CORS-renderable.
- If no reliable article image exists, omit `image` and use text/timeline/quote
  scenes.
- Every image must include `credit`.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer a soft news bed from
  `public/assets/news/manifest.json`, especially `nastelbom-soft-music` or
  `miromaxmusic-music-promotion`.
