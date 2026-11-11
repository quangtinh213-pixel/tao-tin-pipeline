# Local Video Dashboard Design

## Goal

Add a local, read-only dashboard for the generated video artifacts already stored under `videos/`. The dashboard lets the user find a rendered video in Finder and copy its generated script to the clipboard without downloading, previewing, or editing the video.

## Scope

### In scope

- Start a local dashboard with `npm run dashboard`.
- Scan `videos/<slug>/` and show only entries that contain `output/video.mp4`.
- Show the video title, template, source date, rendered status, and absolute path to `video.mp4`.
- Open Finder with the rendered file selected via the macOS `open -R` command.
- Copy the complete script text from `script/script.json` to the browser clipboard.
- Provide search and refresh controls for the artifact list.
- Show clear success and error feedback for Finder and clipboard actions.

### Out of scope

- Video playback in the dashboard.
- Rendering, generation, editing, deletion, or renaming of videos.
- File download endpoints.
- Script preview or inline script editing.
- Authentication or remote hosting.
- Changes to the Remotion pipeline.

## User flow

1. Run `npm run dashboard` from the project root.
2. Open the local URL printed by the server.
3. Search or scan the list of rendered videos.
4. Click `Mở trong Finder` to reveal the exact `videos/<slug>/output/video.mp4` file.
5. Click `Sao chép kịch bản` to copy all script segments, one segment per line, in their stored order.

## Architecture

Use a dependency-free Node HTTP server plus static browser assets. The project already includes Node, React, and Remotion dependencies, but the dashboard does not need a second frontend build system for this read-only surface.

### Server

- `scripts/dashboard-data.mjs` owns filesystem scanning and normalization of video records.
- `scripts/dashboard.mjs` owns the HTTP server, static asset serving, JSON routes, and the Finder command.
- The server binds to `127.0.0.1` by default and uses the project root as its artifact root.
- Every route that accepts a slug resolves it against the `videos` directory and rejects path traversal or a non-directory target.
- The server never serves arbitrary filesystem paths or the video bytes themselves.

### Browser client

- `dashboard/index.html` contains the page shell.
- `dashboard/styles.css` provides the dark, compact dashboard layout and responsive behavior.
- `dashboard/app.js` fetches the normalized record list, renders rows/cards, filters in memory, calls Finder and copy actions, and manages toast feedback.
- The browser never displays the script body; script text is fetched only when the user requests a copy action.

## HTTP contract

### `GET /api/videos`

Returns rendered records sorted by output modification time descending:

```json
{
  "videos": [
    {
      "slug": "2026-09-18-httpsvietnamnetvnhinh-anh-cong-an-kham-xet-khan-cap",
      "title": "Công an khám xét khẩn cấp nơi ở của “Đức Cộng” ở Ninh Bình",
      "templateId": "news/media-showcase",
      "date": "19.09.2026",
      "publisher": "VietNamNet News",
      "videoPath": "/absolute/project/path/videos/.../output/video.mp4",
      "videoSizeBytes": 39016775,
      "renderedAt": "2026-09-19T01:26:00.000Z",
      "scriptAvailable": true
    }
  ]
}
```

If `spec.json` is missing or malformed, the record falls back to `template.txt`, the slug, and the output file metadata instead of breaking the complete list.

### `GET /api/videos/:slug/script`

Returns the normalized script only for the requested rendered record:

```json
{
  "slug": "...",
  "script": "Đoạn hook...\n\nĐoạn body...\n\nĐoạn ending..."
}
```

The script text is created by reading `script/script.json`, taking each `script[].text` string in order, trimming empty entries, and joining them with two newlines. A missing or invalid script returns a clear `404`/`422` response so the UI can disable or explain the action.

### `POST /api/videos/:slug/reveal`

Validates the rendered file and invokes `open -R <absolute-video-path>` on macOS. Returns `{ "ok": true }` when the command starts. On non-macOS hosts it returns a clear `501` response; the UI reports that Finder reveal is only supported on macOS in this version.

## UI design

- Header: project name, rendered-video count, refresh button.
- Search field: filters by title, slug, template, or publisher.
- List item: title, date/publisher metadata, template badge, truncated path with full path in the title attribute, and two actions.
- Primary action: `Mở trong Finder`.
- Secondary action: `Sao chép kịch bản`.
- Empty state: explain that rendered files are discovered from `videos/*/output/video.mp4`.
- Loading state: a compact skeleton or status line while `/api/videos` loads.
- Error state: non-blocking error message with retry.
- Toasts: confirm Finder launch and script copy, and describe failures without exposing stack traces.

## Error handling

- Missing `videos/`: return an empty list and a non-fatal warning in the server log.
- Missing output file: omit the entry from the list.
- Malformed metadata: preserve the entry using safe fallbacks.
- Missing script: show `Kịch bản chưa có` and disable the copy action.
- Clipboard permission failure: report the failure; do not display the script as a fallback.
- Finder command failure: report the failure and keep the dashboard usable.
- Unknown API route: return JSON `404`; unknown static asset: return `404`.

## Verification

- Unit tests cover record scanning, newest-first sorting, metadata fallback, script normalization, and traversal rejection.
- HTTP-level tests cover `GET /api/videos`, script retrieval, reveal validation, and JSON error responses without launching a real Finder process.
- TypeScript/JavaScript checks and the existing test suite must pass.
- Manual verification on macOS confirms that `Mở trong Finder` selects the exact `video.mp4` and that the copy button writes the expected joined script to the clipboard.

## Acceptance criteria

- `npm run dashboard` starts a local server and prints its URL.
- The dashboard lists the currently rendered videos from the repository.
- No video is played or downloaded by the dashboard.
- Each rendered item exposes its absolute video path and a working Finder reveal action on macOS.
- Each item with a valid `script/script.json` has a working `Sao chép kịch bản` action.
- The dashboard remains usable when one artifact has incomplete or malformed metadata.
