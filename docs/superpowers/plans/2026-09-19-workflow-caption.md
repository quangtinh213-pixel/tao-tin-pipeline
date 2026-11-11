# Workflow Caption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a validated Vietnamese social caption for every video workflow run and add a dashboard button that copies the caption for posting.

**Architecture:** Add a pure caption-rules module containing story classification, young-Vietnamese phrase selection, caption construction, hashtag derivation, and validation. A small ESM CLI writes `videos/<slug>/caption.txt`; the canonical `/gen-video` docs invoke it after `spec.json`. The existing dashboard reads the caption artifact through one safe API route and adds a third copy action.

**Tech Stack:** Node.js ESM, Node filesystem APIs, Vitest, existing dependency-free local dashboard.

**Spec:** `docs/superpowers/specs/2026-09-19-workflow-caption-design.md`

## Global Constraints

- Every generated caption is written to `videos/<slug>/caption.txt` before Coder.
- Captions contain 100–180 whitespace-separated words and always include `#VnNews213`.
- Captions use exactly the Hook–Content–CTA structure with `🔴`, `⚠️`, or `📌` section markers and an open-ended final question.
- Language is concise, conversational Vietnamese for young audiences without invented facts, unverified guilt, or dense paragraphs.
- Caption generation is local and requires no new API key or network request.
- The dashboard never displays the caption body, posts to a social platform, or accepts caption edits.
- Existing video records remain visible when a caption is missing; only the caption action is disabled.
- All slug routes must reuse the existing path traversal protection.
- This workspace has no Git metadata, so tests and file audits are the integration checkpoints instead of commits.

---

### Task 1: Implement and test caption rules and generation

**Files:**
- Create: `scripts/caption-rules.mjs`
- Create: `scripts/caption-rules.test.mjs`

**Interfaces:**
- `countCaptionWords(caption): number`
- `classifyCaptionStory({title, hook, scriptText}): 'hot' | 'policy'`
- `hasRequiredCaptionHashtags(caption): boolean`
- `buildCaption({title, date, publisher, scriptSegments, planHook, planEnding}): string`
- `validateCaption(caption, {title, hook, scriptText, publisher}): {valid: boolean, errors: string[], wordCount: number, category: 'hot' | 'policy'}`

- [x] **Step 1: Write failing tests for classification and word counting.**

Create `scripts/caption-rules.test.mjs` with assertions such as:

```js
expect(classifyCaptionStory({
  title: 'Cháy lớn tại chợ Kim Sơn',
  hook: 'Lửa bao trùm khu bán vải',
  scriptText: 'Cơ quan chức năng đang làm rõ nguyên nhân',
})).toBe('hot');

expect(classifyCaptionStory({
  title: 'Quy định mới về mức phạt giao thông',
  hook: 'Mức phạt mới được áp dụng',
  scriptText: 'Người dân cần cập nhật quy định',
})).toBe('policy');

expect(countCaptionWords('🔴 NÓNG: Hà Nội hôm nay! #VnNews213')).toBe(6);
```

- [x] **Step 2: Run the focused test and verify the expected missing-module failure.**

Run: `npx vitest run scripts/caption-rules.test.mjs`

Expected: FAIL because `scripts/caption-rules.mjs` does not exist.

- [x] **Step 3: Write failing tests for generated caption contract and invalid-caption reporting.**

Use a fixture with a title, publisher, hook, ending, and at least six Vietnamese script segments. Assert the generated caption:

```js
const caption = buildCaption({title, date, publisher, scriptSegments, planHook, planEnding});
const result = validateCaption(caption, {title, hook: planHook, scriptText: scriptSegments.join(' '), publisher});

expect(result.valid).toBe(true);
expect(result.wordCount).toBeGreaterThanOrEqual(100);
expect(result.wordCount).toBeLessThanOrEqual(180);
expect(caption).toContain('#VnNews213');
expect(caption).toMatch(/^[🔴⚠️📌]/u);
expect(caption.trimEnd()).toMatch(/\?$/u);
```

Add a separate invalid-caption assertion for a greeting, a caption shorter than 100 words, a missing `#VnNews213`, and a binary `Bạn có đồng ý không?` CTA. Assert `validateCaption` returns every applicable error in one result.

- [x] **Step 4: Run the focused test and confirm failures are behavior failures, not fixture errors.**

Run: `npx vitest run scripts/caption-rules.test.mjs`

Expected: FAIL with undefined exports or unmet caption assertions.

- [x] **Step 5: Implement the minimal caption rules module.**

Implement Vietnamese-accent-insensitive keyword classification, a fixed modern phrase bank, safe source-attribution wording, and deterministic 10–15 hashtag derivation. Build the caption from a hook, two or three short content paragraphs, a non-binary CTA, and hashtags. Retain the first and last verified script segments when trimming content, then fit the content section so the complete caption remains within 100–180 words. Never add a fact that is absent from `title`, `planHook`, `planEnding`, `publisher`, or `scriptSegments`.

Implement validation with these exact checks:

```js
const errors = [];
if (wordCount < 100 || wordCount > 180) errors.push('Caption phải có 100–180 từ.');
if (!hasRequiredCaptionHashtags(caption)) errors.push('Caption phải có #VnNews213.');
if (!/^[🔴⚠️📌]/u.test(caption.trim())) errors.push('Caption phải có icon mở đầu.');
if (!/\?\s*(?:#|$)/u.test(caption.trim())) errors.push('CTA phải là câu hỏi mở.');
if (/^(?:xin chào|chào mọi người|hello)\b/iu.test(caption.replace(/^[🔴⚠️📌]\s*/u, ''))) {
  errors.push('Caption không được mở đầu bằng lời chào.');
}
```

For hot/legal/developing stories, require one of `Theo`, `cơ quan chức năng`, `đang được điều tra`, `đang làm rõ`, or `chưa có thông tin khẳng định`.

- [x] **Step 6: Run the focused test and verify it passes.**

Run: `npx vitest run scripts/caption-rules.test.mjs`

Expected: all classification, generation, length, hashtag, CTA, attribution, and invalid-caption tests pass.

- [x] **Step 7: Run the existing suite as a regression check.**

Run: `npm test`

Expected: all existing tests plus the caption rules tests pass.

### Task 2: Add caption generation and validation CLIs

**Files:**
- Create: `scripts/generate-caption.mjs`
- Create: `scripts/validate-caption.mjs`
- Create: `scripts/caption-cli.test.mjs`

**Interfaces:**
- `generateCaption(rootDir, slug, {force = false}): Promise<string>` writes and returns the absolute `caption.txt` path.
- `generate-caption.mjs <slug>` generates one caption; `generate-caption.mjs --all` generates captions for every video directory with a valid `spec.json` and `script/script.json`; `--force` overwrites an existing caption.
- `validate-caption.mjs <captionPath> <specPath> <scriptPath>` exits `0` for a valid caption and `1` with Vietnamese rule errors for an invalid caption.

- [x] **Step 1: Write failing tests for one-video generation and safe reuse.**

Create a temporary project fixture with `videos/story/spec.json`, `videos/story/plan.json`, `videos/story/script/script.json`, and `videos/story/output/video.mp4`. Assert:

```js
const outputPath = await generateCaption(tempRoot, 'story');
expect(outputPath).toBe(join(tempRoot, 'videos', 'story', 'caption.txt'));
expect(await readFile(outputPath, 'utf8')).toContain('#VnNews213');
await expect(generateCaption(tempRoot, 'story')).resolves.toBe(outputPath);
```

The second call must preserve an existing valid caption unless `force: true` is passed.

- [x] **Step 2: Run the focused CLI test and verify the expected missing-module failure.**

Run: `npx vitest run scripts/caption-cli.test.mjs`

Expected: FAIL because `scripts/generate-caption.mjs` does not exist.

- [x] **Step 3: Implement the generation and validation CLIs.**

Read JSON inputs defensively, pass `spec.video.title`, `spec.video.date`, `spec.source.publisher`, `plan.hook`, `plan.ending`, and ordered `script[].text` into `buildCaption`, write UTF-8 text with a final newline, and use the existing safe slug resolver before any file access. `--all` must skip directories missing required inputs and print one generated path per successful record. The validator CLI must read the same metadata, call `validateCaption`, print all errors to stderr, and set `process.exitCode = 1` without throwing a stack trace.

- [x] **Step 4: Run CLI tests and verify generation, reuse, force overwrite, and validation.**

Run: `npx vitest run scripts/caption-rules.test.mjs scripts/caption-cli.test.mjs`

Expected: PASS.

- [x] **Step 5: Run the full test suite.**

Run: `npm test`

Expected: all tests pass.

### Task 3: Integrate the caption phase into the canonical workflow

**Files:**
- Create: `docs/gen-video/caption-sop.md`
- Modify: `docs/SKILL-GEN-VIDEO.md`
- Modify: `docs/gen-video/common-pipeline.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Create: `scripts/workflow-caption-docs.test.mjs`

**Interfaces:**
- The canonical workflow invokes `node scripts/generate-caption.mjs "<slug>"` after `spec.json` verification and before Coder.
- The generated artifact is `videos/<slug>/caption.txt`.
- The validator command is `node scripts/validate-caption.mjs ...`.

- [x] **Step 1: Write failing documentation contract tests.**

Assert that the canonical documents contain all of these exact anchors: `caption.txt`, `caption-sop.md`, `generate-caption.mjs`, `validate-caption.mjs`, `#VnNews213`, and the requirement to complete caption generation before Coder. Assert `AGENTS.md` and `README.md` list `caption.txt` in the video artifact structure.

- [x] **Step 2: Run the documentation test and verify it fails because the new SOP/anchors are absent.**

Run: `npx vitest run scripts/workflow-caption-docs.test.mjs`

Expected: FAIL on missing file or missing workflow anchor.

- [x] **Step 3: Write the canonical caption SOP.**

Create `docs/gen-video/caption-sop.md` with the user-provided four-step process, the two story matrices, 100–180 word limit, young-Vietnamese tone, attribution/safety rules, open CTA rule, mandatory `#VnNews213`, and 10–15 relevant SEO hashtags. Include a worked format template without inventing story facts.

- [x] **Step 4: Wire the workflow documentation.**

In `docs/SKILL-GEN-VIDEO.md`, add Caption as the post-Spec/pre-Coder phase, include its inputs/output, run commands, validation requirement, and completion-contract entry. In `docs/gen-video/common-pipeline.md`, add the shared caption artifact and failure rule. Update `AGENTS.md` pipeline overview/project structure and `README.md` workflow/artifact notes.

- [x] **Step 5: Run documentation tests and the full suite.**

Run: `npx vitest run scripts/workflow-caption-docs.test.mjs && npm test`

Expected: documentation checks and all existing tests pass.

### Task 4: Expose caption artifacts through dashboard data and HTTP

**Files:**
- Modify: `scripts/dashboard-data.mjs`
- Modify: `scripts/dashboard-data.test.mjs`
- Modify: `scripts/dashboard.mjs`
- Modify: `scripts/dashboard-server.test.mjs`

**Interfaces:**
- Produces `readCaptionText(videosDir, slug): Promise<string | null>`.
- Adds `captionAvailable: boolean` to every `VideoRecord`.
- Adds `GET /api/videos/:slug/caption` returning `{slug, caption}`.

- [x] **Step 1: Write failing data tests for caption availability and safe reads.**

Extend the existing fixture with `caption.txt`, assert `captionAvailable: true`, and assert `readCaptionText(...)` returns the exact text. Add a rendered fixture without caption and assert `captionAvailable: false` and `readCaptionText(...) === null`.

- [x] **Step 2: Run the focused data test and verify it fails on missing caption behavior.**

Run: `npx vitest run scripts/dashboard-data.test.mjs`

Expected: FAIL because the new export/record field is missing.

- [x] **Step 3: Implement safe caption reading and the record field.**

Read only `caption.txt` beneath a validated rendered video directory, trim one trailing newline without collapsing intentional blank lines, and return null for missing or empty files. Set `captionAvailable` from the normalized caption value.

- [x] **Step 4: Write failing HTTP tests for the caption route.**

Extend the server fixture with `caption.txt` and assert:

```js
const response = await fetch(`${baseUrl}/api/videos/rendered-story/caption`);
expect(response.status).toBe(200);
expect((await response.json()).caption).toContain('#VnNews213');
```

Also assert a rendered video without caption returns `422`, a missing video returns `404`, and an encoded traversal slug returns `400`.

- [x] **Step 5: Run the server test and confirm the expected route failure.**

Run: `npx vitest run scripts/dashboard-server.test.mjs`

Expected: FAIL because `/caption` is not routed yet.

- [x] **Step 6: Implement the caption API route and run the focused green tests.**

Mirror the existing script route: validate the rendered record, read the caption, return `404`/`422`/`400` as specified, and never include caption content in `/api/videos` list records.

Run: `npx vitest run scripts/dashboard-data.test.mjs scripts/dashboard-server.test.mjs`

Expected: PASS.

### Task 5: Add the dashboard copy-caption action

**Files:**
- Modify: `dashboard/app.js`
- Modify: `dashboard/styles.css`
- Modify: `scripts/dashboard-assets.test.mjs`

**Interfaces:**
- Each rendered card exposes `Sao chép caption` when `record.captionAvailable` is true.
- The browser fetches `/api/videos/:slug/caption` only after the click and calls `navigator.clipboard.writeText(payload.caption)`.
- The caption text never appears in the initial HTML or card DOM.

- [x] **Step 1: Write failing static asset assertions.**

Assert that `app.js` contains `/caption`, `navigator.clipboard.writeText`, and `Sao chép caption`, and that the HTML shell does not contain a generated caption body. Assert the card action list can accommodate three actions without changing the no-player/no-download contract.

- [x] **Step 2: Run the focused asset test and verify it fails.**

Run: `npx vitest run scripts/dashboard-assets.test.mjs`

Expected: FAIL because the caption action and route reference are absent.

- [x] **Step 3: Implement the copy-caption action and responsive layout.**

Add a third button beside Finder and script copy, disable it with `Caption chưa có` when unavailable, fetch the caption on click, copy it, and reuse the existing toast. Update `.card-actions` to wrap cleanly on narrow screens without changing the path or script behavior.

- [x] **Step 4: Run the asset and HTTP tests.**

Run: `npx vitest run scripts/dashboard-assets.test.mjs scripts/dashboard-server.test.mjs`

Expected: PASS; the page has the caption action but still has no player, download control, or caption preview.

- [x] **Step 5: Run the full suite.**

Run: `npm test`

Expected: all tests pass.

### Task 6: Backfill current videos, wire commands, and verify end to end

**Files:**
- Modify: `package.json` to add `generate-caption` and `validate-caption` scripts.
- Modify: `README.md` with the caption copy workflow.
- Generated: `videos/*/caption.txt` for every rendered video with valid inputs.

**Interfaces:**
- `npm run generate-caption -- <slug>` generates one caption.
- `npm run generate-caption -- --all` backfills all eligible video directories.
- `npm run validate-caption -- <caption> <spec> <script>` validates one caption.

- [x] **Step 1: Add package commands and README usage.**

Document that `/gen-video` creates `caption.txt` automatically and that the dashboard copies the caption without posting it anywhere.

- [x] **Step 2: Backfill and validate every current rendered video.**

Run:

```bash
npm run generate-caption -- --all --force
for spec in videos/*/spec.json; do slug="$(dirname "$spec")"; slug="${slug#videos/}"; node scripts/validate-caption.mjs "videos/$slug/caption.txt" "videos/$slug/spec.json" "videos/$slug/script/script.json"; done
```

Expected: one caption file per rendered video and every validator invocation exits `0`.

- [x] **Step 3: Run syntax, type, tests, and workflow smoke checks.**

Run:

```bash
node --check scripts/caption-rules.mjs
node --check scripts/generate-caption.mjs
node --check scripts/validate-caption.mjs
node --check scripts/dashboard-data.mjs
node --check scripts/dashboard.mjs
node --check dashboard/app.js
npx tsc --noEmit
npm test
```

Expected: all commands exit successfully.

- [x] **Step 4: Run the live dashboard smoke test.**

Start `npm run dashboard -- --port 0`, request `/api/videos`, confirm every rendered record reports `captionAvailable: true`, request one `/api/videos/:slug/caption`, and confirm the browser copy action shows `Đã sao chép caption` without rendering caption text.

- [x] **Step 5: Perform the final requirements audit.**

Confirm the generated captions are 100–180 words, contain 10–15 relevant SEO hashtags including `#VnNews213`, use a concrete hook, include attribution where required, end with an open question, and contain no greeting or unsupported claim. Confirm no network/social posting occurs.

## Plan Self-Review

- Spec coverage: generation phase, local young-Vietnamese style, four-step SOP, validation, mandatory hashtag, backfill, API, copy UI, error handling, tests, and no-posting boundary are covered by Tasks 1–6.
- No placeholder markers or unspecified implementation steps remain.
- Interface names are consistent across tasks: `buildCaption`, `validateCaption`, `generateCaption`, `readCaptionText`, `captionAvailable`, and `/caption`.
- Scope remains one feature spanning the existing workflow and dashboard; no separate publishing subsystem is introduced.
