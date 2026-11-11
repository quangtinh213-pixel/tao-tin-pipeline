# /update-logo — Replace The Default Watermark Logo

## Trigger

Run when the user types:

```text
/update-logo
/update-logo --file <filename-or-path>
```

Before running the command, the user places one or more `.png` files in
`tmp-logo/` at the project root.

## Behavior

This command replaces the shared watermark asset at `public/watermark.png`.
Existing templates render this file directly, so the target filename must remain
`watermark.png`.

Run:

```bash
npm run update-logo
npm run update-logo -- --file <filename-or-path>
```

Rules:

1. Only accept `.png` files.
2. If `--file` is provided, resolve it as either:
   - a direct path from the project root or absolute filesystem path;
   - a filename inside `tmp-logo/`, for example `logo.png`.
3. If `--file` is omitted, read `tmp-logo/` and halt unless it contains exactly
   one `.png` file.
4. Copy the selected PNG to `public/watermark.png`, replacing the previous
   watermark.
5. Do not update templates, docs, registry entries, or generated video files.
6. Do not commit or track files inside `tmp-logo/`; it is local staging only.

## Completion

After the script succeeds, report:

- source logo path;
- target path `public/watermark.png`.
