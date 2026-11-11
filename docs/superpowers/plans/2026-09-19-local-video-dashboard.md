# Local Video Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local read-only dashboard that lists rendered videos, reveals their exact files in macOS Finder, and copies generated scripts without previewing, downloading, or editing artifacts.

**Architecture:** Add a small dependency-free Node HTTP server that scans `videos/`, exposes only normalized JSON routes, and invokes `open -R` for the Finder action. Serve a static HTML/CSS/JavaScript client from `dashboard/`; keep filesystem parsing in a pure data module so it can be tested independently from HTTP and browser behavior.

**Tech Stack:** Node.js ESM, `node:http`, `node:fs/promises`, browser HTML/CSS/JavaScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-local-video-dashboard-design.md`

## Global Constraints

- The dashboard is local-only and binds to `127.0.0.1`; it must not become a remote file server.
- Only directories containing `videos/<slug>/output/video.mp4` appear in the rendered list.
- The dashboard must not render a `<video>` element, expose a download route, display script text, or mutate Remotion artifacts.
- Finder reveal is implemented for macOS with `open -R`; non-macOS hosts return a clear unsupported response.
- All user-controlled slug/path input is validated against the `videos` root before filesystem or Finder access.
- The browser receives script text only after the user clicks `Sao chép kịch bản`.
- No new runtime dependency or frontend build system is required.
- The workspace has no Git metadata, so implementation checkpoints use tests and file inspection rather than commits.

---

### Task 1: Add tested video-artifact and script normalization helpers

**Files:**
- Create: `scripts/dashboard-data.mjs`
- Create: `scripts/dashboard-data.test.mjs`

**Interfaces:**
- Produces `scanVideoRecords(videosDir): Promise<VideoRecord[]>`.
- Produces `getVideoRecord(videosDir, slug): Promise<VideoRecord | null>`.
- Produces `readScriptText(videosDir, slug): Promise<string | null>`.
- Produces `resolveVideoDirectory(videosDir, slug): string`, throwing `DASHBOARD_INVALID_SLUG` for traversal or non-single-segment slugs.
- `VideoRecord` has `slug`, `title`, `templateId`, `date`, `publisher`, `videoPath`, `videoSizeBytes`, `renderedAt`, and `scriptAvailable` fields.

- [ ] **Step 1: Write the failing tests for rendered-record discovery and sorting.**

Create a temporary fixture with:

```js
const rendered = path.join(tempRoot, 'rendered-story');
await mkdir(path.join(rendered, 'output'), {recursive: true});
await writeFile(path.join(rendered, 'output', 'video.mp4'), 'video');
await writeFile(path.join(rendered, 'template.txt'), 'news/media-showcase\n');
await mkdir(path.join(rendered, 'script'), {recursive: true});
await writeFile(path.join(rendered, 'spec.json'), JSON.stringify({
  video: {title: 'Rendered story', date: '19.09.2026'},
  source: {publisher: 'Example News'}
}));
await writeFile(path.join(rendered, 'script', 'script.json'), JSON.stringify({
  script: [{text: 'Hook'}, {text: 'Body'}]
}));
```

Assert that `scanVideoRecords(tempRoot)` returns the record with the absolute `videoPath`, metadata from `spec.json`, `scriptAvailable: true`, and that records are ordered by `renderedAt` descending. Add a second directory without `output/video.mp4` and assert it is omitted.

- [ ] **Step 2: Run the focused test and verify the expected missing-module failure.**

Run: `npx vitest run scripts/dashboard-data.test.mjs`

Expected: FAIL because `scripts/dashboard-data.mjs` does not exist yet; do not change the test to make it pass without implementation.

- [ ] **Step 3: Write failing tests for metadata fallback, script normalization, and traversal rejection.**

Add assertions that:

```js
expect(await readScriptText(tempRoot, 'rendered-story')).toBe('Hook\n\nBody');
expect(() => resolveVideoDirectory(tempRoot, '../outside')).toThrow(/invalid slug/i);
```

Also create a malformed `spec.json`, assert the record falls back to the slug for `title`, reads `template.txt`, and still appears because the output video is valid. Assert a missing or empty script produces `scriptAvailable: false` and `readScriptText(...) === null`.

- [ ] **Step 4: Run the focused test and confirm the failures are about the missing helpers or behavior.**

Run: `npx vitest run scripts/dashboard-data.test.mjs`

Expected: FAIL with undefined exports or unmet assertions, not a fixture/setup error.

- [ ] **Step 5: Implement the minimal filesystem helpers.**

In `scripts/dashboard-data.mjs`:

```js
export function resolveVideoDirectory(videosDir, slug) {
  const root = resolve(videosDir);
  const candidate = resolve(root, slug);
  const relativePath = relative(root, candidate);
  if (!slug || slug !== basename(slug) || slug.includes('\\') || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    const error = new Error(`Invalid video slug: ${slug}`);
    error.code = 'DASHBOARD_INVALID_SLUG';
    throw error;
  }
  return candidate;
}
```

Use `stat` to require `output/video.mp4`, parse `spec.json` defensively, read `template.txt` as a fallback, and use output `mtime` for sorting and `renderedAt`. Normalize script entries by retaining non-empty string `text` fields and joining them with two newlines. Catch per-directory metadata errors so one malformed artifact cannot abort the list.

- [ ] **Step 6: Run the focused test and verify it passes.**

Run: `npx vitest run scripts/dashboard-data.test.mjs`

Expected: PASS with all discovery, fallback, script, and traversal assertions green.

- [ ] **Step 7: Run the existing suite as a regression check.**

Run: `npm test`

Expected: all existing tests plus `scripts/dashboard-data.test.mjs` pass with no uncaught warnings.

### Task 2: Add the tested local HTTP server and Finder reveal route

**Files:**
- Create: `scripts/dashboard.mjs`
- Create: `scripts/dashboard-server.test.mjs`

**Interfaces:**
- Produces `createDashboardServer({rootDir, finder, logger}): http.Server`.
- `finder(videoPath)` is an injected async function used by the reveal route and defaults to `open -R <videoPath>` on macOS.
- `GET /api/videos` returns `{videos: VideoRecord[]}`.
- `GET /api/videos/:slug/script` returns `{slug, script}`.
- `POST /api/videos/:slug/reveal` returns `{ok: true}` after the injected Finder launcher starts.
- Unknown API routes return JSON `404`; invalid slugs return JSON `400`.

- [ ] **Step 1: Write failing HTTP tests for the list and script routes.**

Start `createDashboardServer` on `127.0.0.1` with a temporary fixture from Task 1, then assert:

```js
const listResponse = await fetch(`${baseUrl}/api/videos`);
expect(listResponse.status).toBe(200);
expect((await listResponse.json()).videos[0].slug).toBe('rendered-story');

const scriptResponse = await fetch(`${baseUrl}/api/videos/rendered-story/script`);
expect(scriptResponse.status).toBe(200);
expect((await scriptResponse.json()).script).toBe('Hook\n\nBody');
```

- [ ] **Step 2: Run the server test and confirm the expected missing-module failure.**

Run: `npx vitest run scripts/dashboard-server.test.mjs`

Expected: FAIL because `scripts/dashboard.mjs` and `createDashboardServer` do not exist yet.

- [ ] **Step 3: Add failing tests for reveal injection and route safety.**

Use an injected launcher:

```js
const revealed = [];
const server = createDashboardServer({rootDir, finder: async (videoPath) => revealed.push(videoPath)});
const response = await fetch(`${baseUrl}/api/videos/rendered-story/reveal`, {method: 'POST'});
expect(response.status).toBe(200);
expect(revealed).toEqual([path.join(rootDir, 'videos', 'rendered-story', 'output', 'video.mp4')]);
```

Also assert `POST /api/videos/%2E%2E%2Foutside/reveal` returns `400`, `GET /api/videos/missing/script` returns `404`, and an unknown `/api/unknown` route returns JSON `404`.

- [ ] **Step 4: Run the server test and confirm the failures are route/implementation failures.**

Run: `npx vitest run scripts/dashboard-server.test.mjs`

Expected: FAIL on missing server exports or the specific route assertions, not on network setup.

- [ ] **Step 5: Implement the minimal server and default Finder launcher.**

In `scripts/dashboard.mjs`:

```js
export function createDashboardServer({rootDir, finder = revealInFinder, logger = console}) {
  const videosDir = join(rootDir, 'videos');
  return createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (request.method === 'GET' && requestUrl.pathname === '/api/videos') {
      return sendJson(response, 200, {videos: scanVideoRecords(videosDir)});
    }
    return sendJson(response, 404, {error: 'Not found'});
  });
}
```

Use `sendJson` for consistent `Content-Type` and status handling. Decode one slug segment, delegate validation and file reads to `dashboard-data.mjs`, and never accept a filesystem path from the request body. Implement `revealInFinder` with `execFile('open', ['-R', videoPath])` only when `process.platform === 'darwin'`; reject with a typed unsupported error otherwise. Add a CLI entry point that reads `DASHBOARD_PORT` or `--port`, defaults to `4321`, binds to `127.0.0.1`, and prints the local URL.

- [ ] **Step 6: Run server tests and verify the green route contract.**

Run: `npx vitest run scripts/dashboard-data.test.mjs scripts/dashboard-server.test.mjs`

Expected: PASS; the injected Finder launcher is called only with the validated absolute video path.

- [ ] **Step 7: Run the full suite before adding browser assets.**

Run: `npm test`

Expected: all tests pass.

### Task 3: Build the static dashboard UI with copy and Finder actions

**Files:**
- Create: `dashboard/index.html`
- Create: `dashboard/styles.css`
- Create: `dashboard/app.js`
- Modify: `scripts/dashboard.mjs` to serve only these static assets from `dashboard/`
- Create: `scripts/dashboard-assets.test.mjs`

**Interfaces:**
- The server serves `/` → `dashboard/index.html`, `/styles.css` → `dashboard/styles.css`, and `/app.js` → `dashboard/app.js`.
- The browser consumes the API contract from Task 2; no browser code reads `videos/` directly.
- The UI exposes only `Mở trong Finder` and `Sao chép kịch bản` actions for each record.

- [ ] **Step 1: Write failing asset and behavior checks.**

Add tests that request `/`, `/styles.css`, and `/app.js` and assert `200` responses with the expected content types. Assert the HTML includes the search input, refresh button, and no `<video` tag or download link. Assert `app.js` references `/api/videos`, `/script`, `/reveal`, and `navigator.clipboard.writeText`.

- [ ] **Step 2: Run the checks and verify they fail because the dashboard assets are absent.**

Run: `npx vitest run scripts/dashboard-assets.test.mjs`

Expected: FAIL with missing static files or missing route responses.

- [ ] **Step 3: Implement the page shell and styling.**

Create a responsive dark dashboard with:

- a compact header containing project name, rendered count, and refresh button;
- a search field filtering title, slug, template, and publisher;
- a row/card for each record showing title, date/publisher, template badge, and a truncated absolute path whose full value is available via `title`;
- a primary `Mở trong Finder` button and secondary `Sao chép kịch bản` button;
- loading, empty, error, and toast states.

Keep all user-provided metadata inserted with `textContent`/DOM node properties, not raw `innerHTML`.

- [ ] **Step 4: Implement the browser actions.**

In `dashboard/app.js`:

```js
async function copyScript(slug) {
  const response = await fetch(`/api/videos/${encodeURIComponent(slug)}/script`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Không thể đọc kịch bản');
  await navigator.clipboard.writeText(payload.script);
  showToast('Đã sao chép kịch bản');
}
```

Call `POST /api/videos/:slug/reveal` for Finder, disable the copy button when `scriptAvailable` is false, refresh records on demand, and show action-specific failures without rendering the script text.

- [ ] **Step 5: Run asset tests and verify the static dashboard contract.**

Run: `npx vitest run scripts/dashboard-assets.test.mjs scripts/dashboard-server.test.mjs`

Expected: PASS; all static assets load, the page has no player/download UI, and both actions point to the intended API routes.

- [ ] **Step 6: Run the full test suite.**

Run: `npm test`

Expected: all tests pass.

### Task 4: Wire the command, document usage, and perform end-to-end verification

**Files:**
- Modify: `package.json` to add `"dashboard": "node scripts/dashboard.mjs"`.
- Modify: `README.md` with the dashboard command and the two supported actions.

**Interfaces:**
- `npm run dashboard` starts the server on `127.0.0.1:4321` by default.
- `DASHBOARD_PORT=0 npm run dashboard` is allowed for ephemeral smoke-test startup; the printed URL uses the actual bound port.

- [ ] **Step 1: Add the package script and concise usage documentation.**

Document:

```text
npm run dashboard
```

Explain that the dashboard reads rendered artifacts from `videos/`, opens `video.mp4` in Finder, and copies the stored script; it does not preview or download media.

- [ ] **Step 2: Run syntax and project checks.**

Run:

```bash
node --check scripts/dashboard-data.mjs
node --check scripts/dashboard.mjs
node --check dashboard/app.js
npx tsc --noEmit
npm test
```

Expected: every command exits successfully.

- [ ] **Step 3: Run a local server smoke test.**

Start `npm run dashboard` and request `http://127.0.0.1:4321/api/videos` from a second shell. Confirm the response contains the existing rendered records, then stop the server cleanly.

- [ ] **Step 4: Perform the macOS manual acceptance check.**

Open the dashboard in a browser, search for one known slug, click `Mở trong Finder`, and confirm Finder selects the exact `videos/<slug>/output/video.mp4`. Click `Sao chép kịch bản`, paste into a text editor, and confirm the text contains the ordered script segments separated by blank lines. Confirm there is no player, script preview, or download control.

- [ ] **Step 5: Re-run the full verification after manual checks.**

Run: `npm test && npx tsc --noEmit`

Expected: all automated checks remain green after the final UI changes.

## Plan Self-Review

- Spec coverage: list, metadata, path display, Finder reveal, copy-only script action, search, refresh, safe local server, graceful malformed artifacts, tests, and documentation are covered by Tasks 1–4.
- No placeholder markers or unspecified implementation step is required.
- Type/interface consistency: `VideoRecord`, `scanVideoRecords`, `getVideoRecord`, `readScriptText`, `resolveVideoDirectory`, and `createDashboardServer` are named consistently across tasks and the spec.
- Scope check: the plan contains one subsystem with four independently testable deliverables and no generation/editor work.
