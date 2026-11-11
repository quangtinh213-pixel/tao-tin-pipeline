# Template Spec Rules: news/current-affairs-dark

Read this document before running Step 6 (Spec) when `--template news/current-affairs-dark` is specified.

---

## What this template is

Fixed short-form news template for Vietnamese current affairs: politics, public policy, new era reforms, daily-life issues, jobs, transport, public services, and civic impact.

Visual direction:
- Dark civic briefing look: deep navy background, subtle map/grid lines, amber + cyan accents.
- Best for serious, urgent, institutional, geopolitical, transport, or policy-impact stories.
- Uses the same fixed schema as `news/current-affairs-light`.
- Media remains important: use real article photos/videos whenever available.
- Distinct structure from tech news: situation-room masthead, dossier sidebar, vertical briefing body, full-width evidence bands, and "what to watch" ending.

Do not make it look like a tech launch or entertainment template. Keep the tone sober, authoritative, and source-driven.

---

## Input handling

Same as `news/current-affairs-light`:
- Fetch article URL when provided.
- Extract title, publication date, source, location, key facts, quotes, numbers, and media.
- Accept only `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mov`.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tiny tracking images, logos, and fabricated media.

---

## Step 6 Output

Create `videos/<slug>/spec.json`:

```json
{
  "templateId": "news/current-affairs-dark",
  "slug": "<slug>",
  "totalFrames": <number>,
  "video": {
    "title": "<Vietnamese title — max 8 words>",
    "date": "<DD/MM/YYYY>",
    "bgMusic": "assets/news/music/news-ambient-01.mp3"
  },
  "scenes": []
}
```

`bgMusic` must be `"assets/news/music/news-ambient-01.mp3"`.

Scene timing follows `docs/gen-video/common-pipeline.md`.

---

## Scene Schema

The schema is identical to `news/current-affairs-light`:
- `hook`
- `body`
- `ending`

Use the light document for detailed examples and block-selection rules. The visual difference is in template components only.

Body blocks available:
- `image`
- `stat`
- `chart`
- `compare`
- `bodyItalic`

Dark version is preferred when:
- The story is urgent, conflict-heavy, governance-heavy, or about transport disruption.
- Night, command-center, parliament, police, emergency, or official-meeting visuals dominate.
- A chart/stat needs a stronger briefing-room feel.

Light version is preferred when:
- The story is daily-life, service, employment, education, healthcare, consumer cost, or explanatory civic policy.

---

## Checklist

- [ ] `templateId` is `"news/current-affairs-dark"`.
- [ ] `video.title` has at most 8 Vietnamese words.
- [ ] `video.bgMusic` is `"assets/news/music/news-ambient-01.mp3"`.
- [ ] Every scene has audio-derived timing.
- [ ] Media is real article media.
- [ ] Headlines are specific and verified; `video.title` follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- [ ] `totalFrames` equals the last scene end frame.
