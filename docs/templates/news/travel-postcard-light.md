# news/travel-postcard-light

Fixed template for Vietnamese travel news and destination features with a light
postcard-magazine visual system. It is optimized for destination launches,
seasonal travel stories, festivals, airline/hotel updates, local food, route
guides, and practical visitor notes.

## Input Contract

Use public article facts only. If the context includes a public URL, use only
facts, images, dates, names, credits, and attribution available from that URL or
its accessible media. Do not fabricate source images, credits, destination
claims, prices, schedules, opening dates, weather warnings, or travel rules.

Prefer this template when the article is about:

- one destination, attraction, resort, festival, route, island, city, or region;
- practical travel details such as price, timing, route, booking window, or
  visitor volume;
- food, culture, nature, seasonal experiences, airline/resort launches, or
  weekend trip ideas;
- a photo-led article where real source media should carry the story.

Do not use it for hard political conflict, disasters, crime, luxury real-estate
sales, or purely financial tourism-market commentary.

## Visual System

- 9:16 composition, 1080x1920, 30fps.
- Warm off-white paper background with subtle travel-map grid and a thin
  forest/sea/coral top accent.
- Headlines use `Playfair Display`; body and metadata use `Be Vietnam Pro`.
- Color system: forest green, sea blue, coral accent, sand/white postcard
  surfaces.
- Images are rendered as postcard cards with white borders, rounded corners,
  subtle shadow, source caption, and slow Ken Burns motion.
- Destination or scene stamp appears near the top, like a passport/postcard
  mark.
- Voice subtitles sit near the bottom, with active words in coral.

## Motion

Use restrained editorial travel motion:

- Metadata appears first, then the destination stamp.
- Headline lines reveal one by one.
- Postcard images scale/reveal softly and use a slow zoom.
- Route stops reveal vertically with dots and hairlines.
- Fact cards appear like a boarding pass, with dashed border.
- Avoid cartoon bounce, neon, glitch, 3D, excessive parallax, or decorative
  stock travel icons.

## Spec Schema

Write `videos/<slug>/spec.json` as:

```ts
interface TravelPostcardLightSpec {
  templateId: "news/travel-postcard-light";
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
    type: "travelPostcardLight";
    startFrame: number;
    durationFrames: number;
    audioSegment: { start: number; end: number; text: string };
    travel: {
      variant: "opening" | "experience" | "fact" | "route" | "note" | "gallery" | "closing";
      meta: string;
      destination?: string;
      stamp?: string;
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
      secondaryImage?: {
        src: string;
        storage?: "local" | "remote";
        credit?: string;
        alt?: string;
        fit?: "cover" | "contain";
        position?: string;
      };
      fact?: { label: string; value: string; unit?: string; note?: string };
      route?: Array<{ label: string; detail?: string; time?: string }>;
      notes?: Array<{ label: string; text: string }>;
      tags?: string[];
      cta?: string;
      hashtags?: string;
    };
  }>;
}
```

## Scene Guidance

Use 6-8 scenes for a 45-75 second video.

- `opening`: destination hook with one strong source image.
- `experience`: one main travel experience, food, culture, nature, hotel, or
  event detail.
- `fact`: one key number such as price, passenger volume, distance, duration,
  occupancy, opening date, or booking window.
- `route`: itinerary or access path with 3-5 stops.
- `note`: practical local note, checklist, weather/season, booking, safety, or
  visitor advice.
- `gallery`: one or two source images when the article is strongly photo-led.
- `closing`: takeaway, when to go, what to watch next, or a soft save/share CTA.

Headline rules:

- Use manual line breaks in `headline` with `\n`.
- Keep opening headlines to 3-5 short lines.
- Put key words to become coral in `accentWords`.
- Keep non-opening headlines to 2-4 lines.

Body rules:

- Keep each body field under about 150 Vietnamese characters.
- Body copy should add context, not repeat the voice subtitle.
- Use `tags` for short travel labels such as `BIỂN`, `ẨM THỰC`, `LỄ HỘI`,
  `CUỐI TUẦN`, `BAY THẲNG`, `RESORT`.

Media rules:

- Use `<Img>` compatible still images only: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Remote images must be public and CORS-renderable.
- Never use `.gif`, `.svg`, `.avif`, or decorative/fabricated image URLs.
- Include image credit whenever available.
- If no reliable image exists, use `fact`, `route`, `note`, or `closing`
  variants rather than inventing media.

Audio:

- Narration is always rendered by the global pipeline.
- For omitted `--audio`, prefer a soft travel/editorial bed from
  `public/assets/news/manifest.json`, especially `nastelbom-soft-music` or
  `miromaxmusic-music-promotion`.
