# Template Spec Rules: news/current-affairs-light

Read this document before running Step 6 (Spec) when `--template news/current-affairs-light` is specified.

---

## What this template is

Fixed short-form news template for Vietnamese current affairs: politics, public policy, new era reforms, daily-life issues, jobs, transport, public services, and civic impact.

Visual direction:
- Light civic editorial look: warm paper background `#F7F2E8`, red seal accent, navy institutional secondary color.
- Serious, factual, not sensational. Use concise on-screen headlines and clear source labels; `video.title` follows the curiosity Title rules in `docs/gen-video/common-pipeline.md`.
- Media remains important: use real photos/videos from the article whenever available.
- Best for URL-driven news where the article provides title, date, facts, quotes, figures, and media.
- Distinct structure from tech news: front-page masthead, civic dossier sidebar, vertical briefing body, full-width evidence bands, and "what to watch" ending.

Do not use a tech/gadget tone. Avoid futuristic language unless the story is explicitly about a national "new era" policy or institutional reform.

---

## Input handling

### If user provides a URL

1. Fetch the article content using web tools.
2. Extract title, publication date, author/source, location, key facts, direct quotes, numbers, and media URLs.
3. Record article images/videos with `src`, `credit`, `date`, `mediaType`, and optional `locationLabel`.
4. Build the normal plan/script/spec pipeline.

Media URL rules:
- Accept `.jpg`, `.jpeg`, `.png`, `.webp`, `.mp4`, `.mov`.
- Reject `.gif`, `.svg`, `.avif`, `.bmp`, tracking pixels, logos, avatar thumbnails, and decorative icons.
- Keep query params in CDN URLs.
- If format is uncertain, omit the media.
- Never fabricate a photo/video URL.

### If user provides plain text

Follow the normal pipeline. Omit `image` fields unless the user supplies a valid media URL.

---

## Step 2 Planner Rules

Use a Vietnamese neutral-journalistic tone.

Plan shape is the standard pipeline, with:
- `hook`: why the news matters now.
- `segments`: 2-3 body segments, one key fact each.
- `ending`: what changes next, what authorities/businesses/people should watch.
- `estimated_duration`: 20-35 seconds.

Prioritize civic relevance over drama:
- Who is affected?
- What changed?
- When does it take effect?
- What number or location proves the point?
- What remains uncertain?

---

## Step 3 Teller Rules

- Hook: 1-2 short factual sentences.
- Body: each segment explains one event, policy, number, location, quote, or consequence.
- Ending: implication or next milestone.
- Avoid opinionated adjectives unless attributed to a source.
- Use exact names/titles from the article.
- For politics and policy, distinguish proposal, approval, implementation, and enforcement.

---

## Step 6 Output

Create `videos/<slug>/spec.json`:

```json
{
  "templateId": "news/current-affairs-light",
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

Use `docs/gen-video/common-pipeline.md` Shared Timing Contract.

---

## Scene Types

### `hook`

Use for the first script segment.

```json
{
  "type": "hook",
  "startFrame": 0,
  "durationFrames": 210,
  "audioSegment": { "start": 0, "end": 7, "text": "..." },
  "hook": {
    "tags": ["Chính trị", "Quốc hội", "Dân sinh"],
    "badge": { "type": "breaking", "date": "16/06/2026", "tags": ["Hà Nội"] },
    "headline": "{Chính sách mới} tác động tới {người lao động}",
    "lead": "Một thay đổi vừa được công bố có thể ảnh hưởng trực tiếp tới thu nhập và đi lại hằng ngày."
  }
}
```

Hook tags: max 4, selected from or similar to `Chính trị`, `Kỷ nguyên mới`, `Dân sinh`, `Việc làm`, `Giao thông`, `Đô thị`, `Giá cả`, `Giáo dục`, `Y tế`.

Headline rules:
- Hook max 10 words.
- Body/ending max 12 words.
- Wrap 1-3 key terms in `{}` for accent color.
- Prefer concrete actors, places, numbers, and policy names.

### `body`

Use for each factual segment.

```json
{
  "type": "body",
  "startFrame": 210,
  "durationFrames": 270,
  "audioSegment": { "start": 7, "end": 16, "text": "..." },
  "body": {
    "tags": ["Việc làm", "Thu nhập"],
    "badge": { "type": "analysis" },
    "headline": "{15 triệu} lao động trong vùng tác động",
    "body": "Nhóm chịu ảnh hưởng lớn nhất là lao động dịch vụ, công nhân khu công nghiệp và người làm việc theo ca.",
    "stat": {
      "label": "LAO ĐỘNG",
      "value": 15,
      "suffix": " triệu",
      "context": "người có thể chịu tác động"
    },
    "image": {
      "src": "https://example.com/photo.jpg",
      "credit": "VnExpress",
      "date": "16/06/2026",
      "mediaType": "ẢNH",
      "locationLabel": "Hà Nội"
    },
    "imageKenBurns": { "direction": "zoom-in", "startScale": 1, "endScale": 1.06 }
  }
}
```

Available blocks:
- `image`: for real article photo/video. Prefer this when a strong visual exists.
- `stat`: for one key number such as budget, timeline, affected people, jobs, routes, percentage.
- `chart`: for 2-4 comparable numbers, such as traffic flow, budget allocation, employment changes.
- `compare`: for before/after, old/new regulation, proposal/approved, official claim/public impact.
- `bodyItalic: true`: direct quote or attributed assessment.

The renderer places these blocks as vertical full-width evidence bands under the
main briefing. Avoid filling every scene with every block; choose the strongest
proof for that scene.

Block selection by topic:
- Politics/policy: `compare` for old vs new policy, `image` for official meeting, `stat` for vote/budget/timeline.
- New era/reform: `chart` for milestones or targets, `compare` for before/after institutional change.
- Daily life: `stat` for prices/benefits/affected households, `image` for street/service scenes.
- Jobs: `stat` for vacancies/wages/workers, `chart` for sector distribution.
- Transport: `image` or video first, `stat` for route count/speed/delay, `chart` for congestion or ridership.

### `ending`

```json
{
  "type": "ending",
  "startFrame": 1620,
  "durationFrames": 150,
  "audioSegment": { "start": 54, "end": 59, "text": "..." },
  "ending": {
    "badge": { "type": "summary" },
    "headline": "Điểm cần theo dõi là {thời điểm áp dụng}",
    "body": "Tác động thật sẽ rõ hơn khi hướng dẫn chi tiết được công bố và các địa phương bắt đầu triển khai."
  }
}
```

Do not include `cta`; the renderer hardcodes "Bấm Theo Dõi".

---

## Badge Guide

| Story content | Badge |
|---|---|
| Breaking public update | `breaking` |
| Meeting, vote, announcement, incident | `event` |
| Explainer, impact analysis, policy details | `analysis` |
| Exclusive scoop | `exclusive` |
| Follow-up or changed detail | `update` |
| Final scene | `summary` |

---

## Checklist

- [ ] `templateId` is `"news/current-affairs-light"`.
- [ ] `video.title` has at most 8 Vietnamese words.
- [ ] `video.bgMusic` is `"assets/news/music/news-ambient-01.mp3"`.
- [ ] Each scene has audio-derived `startFrame`, `durationFrames`, and `audioSegment`.
- [ ] Media is real article media, not fabricated.
- [ ] Headlines are factual and specific; `video.title` follows the curiosity Title rules.
- [ ] `totalFrames` equals the last scene end frame.
