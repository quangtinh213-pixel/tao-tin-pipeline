# Workflow Caption Design

## Goal

Make every generated video produce a ready-to-post Vietnamese social caption and expose a `Sao chép caption` action in the local dashboard. Captions should feel current and natural to young Vietnamese audiences while preserving source accuracy and the project's channel hashtag.

## Scope

### In scope

- Add a caption-generation phase to the `/gen-video` workflow after `spec.json` is available.
- Write the result to `videos/<slug>/caption.txt`.
- Define a canonical caption SOP in `docs/gen-video/` and reference it from the main workflow documentation and `AGENTS.md`.
- Validate word count, required hashtag, structure markers, and basic safety requirements.
- Read captions from the dashboard server and add a copy button for each rendered video.
- Backfill `caption.txt` for the currently rendered videos so the feature works immediately after rollout.

### Out of scope

- Rendering captions into the Remotion video.
- Posting to TikTok, Facebook, YouTube, or another social platform.
- Login, scheduling, analytics, or platform-specific publishing APIs.
- Automatic live trend research or copying phrases from third-party content.
- Editing captions inside the dashboard.

## Caption generation point

The workflow generates the caption after Step 6 writes and verifies `videos/<slug>/spec.json`, and before Step 7 Coder. This makes the caption input complete without changing audio, timing, scenes, or rendered output.

Inputs:

- `videos/<slug>/context.txt` for the original URL or raw context;
- `videos/<slug>/plan.json` for the planned title and hook;
- `videos/<slug>/script/script.json` for verified narration;
- `videos/<slug>/spec.json` for the final title, date, publisher, and template ID;
- the caption SOP in `docs/gen-video/caption-sop.md`.

Output:

```text
videos/<slug>/caption.txt
```

The workflow agent writes the caption, runs the validator, revises any failed rule, and only then proceeds to Coder. The caption is not sent through TTS and does not affect video duration.

## Caption contract

Each caption must:

1. Contain 100–180 whitespace-separated words, including the CTA and hashtags.
2. Start with a strong SEO keyword plus a concrete number, location, or notable development within the first five words.
3. Use exactly three content blocks:
   - Hook: one short opening line beginning with `🔴`, `⚠️`, or `📌`;
   - Content: two or three short lines that explain the verified cause/development/result;
   - CTA: one final open-ended question that invites an opinion or emotional response.
4. Add blank lines between blocks and never form one dense paragraph.
5. Always include `#VnNews213`.
6. Include 10–15 SEO hashtags: the channel tag, discovery tags such as `#tintuc`, `#tinmoi`, and `#capnhat`, a matching category group such as `#phapluat`, `#canhbao`, `#xahoi`, `#thoisu`, `#chinhsach`, `#kinhte`, or `#doisong`, and specific location/event tags derived from the actual story.
7. Use source attribution such as `Theo VietNamNet News` or `Theo thông tin được công bố` when a publisher is unavailable.

## Young-audience language rules

- Prefer concise, conversational Vietnamese that sounds natural on TikTok without becoming slang-heavy.
- Put the concrete fact before commentary: location, amount, date, consequence, or official action.
- Allowed tone patterns include `NÓNG`, `Đáng chú ý`, `Điều khiến nhiều người quan tâm`, and `Câu hỏi được đặt ra` when they are supported by the source.
- Do not use greetings, generic engagement bait, all-caps paragraphs, invented reactions, unverified claims, or sensational wording that changes the factual meaning.
- For legal or developing stories, use attribution and uncertainty markers: `Theo báo...`, `cơ quan chức năng cho biết`, `đang được điều tra/làm rõ`, or `chưa có thông tin khẳng định`.
- Do not declare guilt before an official conclusion. Describe arrests, charges, allegations, and convictions precisely.
- CTA questions must not be binary yes/no questions. Prefer `Theo bạn, ... nên được nhìn nhận thế nào?`, `Điều gì cần được làm rõ thêm?`, or an equivalent open question grounded in the story.

## Story classification

Classify from the title, hook, and script keywords:

- **Hot / legal / warning:** fire, accident, death, missing person, arrest, fraud, investigation, crime, warning, emergency, court, sentence, or public safety. Use `🔴` or `⚠️` and a category hashtag from `#tintuc`, `#phapluat`, `#canhbao`, or `#anninh`.
- **Policy / economy / life:** regulation, decree, fine, price, market, jobs, transport policy, public services, education, health guidance, or daily-life changes. Use `📌` and a category hashtag from `#thoisu`, `#chinhsach`, `#kinhte`, or `#doisong`.

If a story matches both groups, prefer the more concrete public-safety or legal framing and keep the wording neutral.

## Validation

Add a pure `scripts/caption-rules.mjs` module and a CLI validator so the workflow can check captions without network access. It exposes:

- `countCaptionWords(caption)`;
- `hasRequiredCaptionHashtags(caption)`;
- `validateCaption(caption, metadata)` returning `{valid, errors, wordCount, category}`;
- `classifyCaptionStory({title, hook, scriptText})`.

The validator rejects captions outside 100–180 words, captions missing `#VnNews213`, captions with fewer than 10 or more than 15 SEO hashtags, duplicate hashtags, captions missing the category's discovery/topic baseline, captions without a recognized section icon, captions without an open-ended question, captions with greeting openings, and captions that omit a source-attribution phrase for a legal/developing story. It reports all failures together so the workflow agent can revise once instead of guessing.

The CLI accepts one caption path and exits non-zero with readable Vietnamese validation errors when the file is invalid:

```bash
node scripts/validate-caption.mjs "videos/<slug>/caption.txt" "videos/<slug>/spec.json" "videos/<slug>/script/script.json"
```

## Dashboard integration

### Data

Extend each rendered `VideoRecord` with `captionAvailable`. The record remains listed when the caption is missing, but the UI disables the caption action and labels it `Caption chưa có`.

### API

Add:

```text
GET /api/videos/:slug/caption
```

The route validates the slug and rendered video exactly like the script route, reads `caption.txt`, and returns:

```json
{
  "slug": "...",
  "caption": "🔴 ..."
}
```

Missing captions return `422`; missing videos return `404`. The server never renders or publishes the caption itself.

### Browser

Add a third card action, `Sao chép caption`, that fetches the caption only after the user clicks and writes it to `navigator.clipboard`. The caption body is not rendered in the dashboard. Show the existing toast pattern for success and failure.

## Existing artifacts

Before finishing the feature, create a valid `caption.txt` for every currently rendered video using the same SOP and validate each file. This avoids a dashboard where all existing records show a disabled action after deployment.

## Error handling

- A missing or invalid caption blocks only the caption action; it must not hide the video record.
- A validator failure reports every failed rule and stops the workflow before Coder.
- A missing publisher uses `Theo thông tin được công bố`.
- Clipboard permission failure reports an error without displaying the caption body.
- Malformed `spec.json` or `script.json` keeps the existing dashboard fallback behavior and marks caption availability false.

## Verification

- Unit tests cover word counting, required hashtags, story classification, open CTA detection, legal attribution, and invalid caption rejection.
- Dashboard data tests cover `captionAvailable` and safe caption reading.
- HTTP tests cover the caption route, missing-caption response, and traversal rejection.
- Browser asset tests verify the third copy action and that the caption body is not rendered in the page shell.
- Workflow documentation tests/checks confirm the caption output and validator command are present in the canonical pipeline docs.
- Run `npm test`, `npx tsc --noEmit`, JavaScript syntax checks, and a live dashboard smoke test.

## Acceptance criteria

- A future `/gen-video` run produces `videos/<slug>/caption.txt` before Coder.
- Every generated caption follows the 100–180 word, Hook–Content–CTA, icon, hashtag, and attribution rules.
- Every current rendered video has a validated caption file after migration.
- The dashboard has a working `Sao chép caption` button that copies only after user action.
- `#VnNews213` appears in every generated caption.
- No social platform is contacted and no caption is posted automatically.
