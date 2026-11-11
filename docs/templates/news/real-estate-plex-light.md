# news/real-estate-plex-light

Fixed template for Vietnamese real-estate news with a clean IBM Plex Sans
editorial system. It is optimized for project handover, apartment interiors,
developer/project updates, infrastructure access, tower status, resident
milestones, and short executive quotes.

## Input Contract

Use public article facts only. If the context includes a public URL, use only
facts, images, dates, names, credits, and attribution available from that URL or
its accessible media. Do not fabricate source images, credits, people names,
quotes, project status, dates, or infrastructure claims.

Prefer this template when the article is about:

- apartment handover or resident move-in milestones;
- project structure, tower status, delivery phases, and internal fit-out;
- transport or amenity proximity around a real-estate project;
- official quotes from developer/property-management representatives;
- clean brand-news presentation where large whitespace is desirable.

Do not use it for heavy legal disputes, civic policy conflict, luxury villa
listings, or market investment commentary.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- White-to-very-light-blue paper background with fine square grid.
- Typography is `IBM Plex Sans` for all text.
- Accent color is bright blue `#1265FF`.
- Headlines are very large, light-weight, left aligned, with accent words in
  blue.
- Images are rectangular, full-width inside the text column, with optional
  `Ảnh: <credit>` under the image.
- Voice subtitles sit near the bottom in gray, with the active spoken word in
  near-black. Do not duplicate subtitle text inside scene body fields.

## Motion

Use restrained modern news motion:

- Meta label fades/slides in first with a short blue rule.
- Headline lines reveal one by one with staggered upward motion.
- Images fade/slide in with a subtle slow zoom.
- Hairlines draw horizontally.
- Table rows and list items reveal one by one.
- Avoid bouncy, playful, glitch, dark, neon, or 3D motion.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface RealEstatePlexLightSpec {
  templateId: "news/real-estate-plex-light";
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
    type: "realEstatePlexLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    plex: {
      variant: "image" | "text" | "route" | "status" | "list" | "quote" | "closing";
      meta: string;
      headline: string;
      accentWords?: string[];
      body?: string;
      body2?: string;
      image?: {
        src: string;
        storage?: "local" | "remote";
        credit?: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
      };
      imageHeight?: number;
      rows?: Array<{ label: string; status: string; accent?: boolean }>;
      items?: Array<{ label: string; text: string }>;
      metric?: { value: string; unit?: string; caption?: string };
      quote?: { text: string; name: string; title?: string };
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Scene Guidance

Use 7-9 scenes for a 45-75 second video.

- `image`: article hook, project location, handover image, apartment photo, or
  milestone with one source image.
- `text`: headline-first context scene, with optional image and short body.
- `route`: one large travel/access metric such as `~20` + `phút`, with body and
  body2 explaining the route.
- `status`: project/tower structure table. Use 2-4 rows.
- `list`: apartment handover/features list. Use 3-5 numbered items.
- `quote`: executive or official quote with name/title.
- `closing`: final follow-up or CTA.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Put the phrase to become blue in `accentWords`; for whole-line blue emphasis,
  include the full line text in `accentWords`.
- Keep most non-opening headlines to 2-4 lines.

Body rules:

- Keep each body field under about 140 Vietnamese characters.
- Body copy should add context, not repeat the voice subtitle.
- For `route`, put the big number in `metric.value`, the unit in `metric.unit`,
  and the small line below it in `metric.caption`.

Media rules:

- Use `<Img>` compatible still images only: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Remote images must be public and CORS-renderable.
- If no reliable image exists, use `text`, `route`, `status`, `list`, or `quote`
  variants.
- Include image credit whenever available.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer a calm news bed from
  `public/assets/news/manifest.json`, especially `nastelbom-soft-music` or
  `miromaxmusic-music-promotion`.
