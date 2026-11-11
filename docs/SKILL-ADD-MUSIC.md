# /add-music — Add A Background Music Asset

## Trigger

Run when the user types:

```text
/add-music --category <name>
/add-music --category <name> --file <filename-or-path>
```

Before running the command, the user places one or more `.mp3` files in
`tmp-music/` at the project root.

## Behavior

This command only adds a music asset. It does not update any template's
`defaultBgMusic`; use `/update-bg-music` separately for that.

Run:

```bash
npm run add-music -- --category <name>
npm run add-music -- --category <name> --file <filename-or-path>
```

Rules:

1. Resolve `<name>` as a folder under `public/assets/<name>/`.
2. Halt if `public/assets/<name>/manifest.json` does not exist.
3. If `--file` is provided, resolve it as either:
   - a direct path from the project root or absolute filesystem path;
   - a filename inside `tmp-music/`, for example `audio1.mp3`.
4. If `--file` is omitted, read `tmp-music/` and halt unless it contains
   exactly one `.mp3` file.
5. Copy the mp3 to `public/assets/<name>/music/<original-filename>.mp3`.
6. Halt if that destination filename already exists.
7. Add one entry to `public/assets/<name>/manifest.json` under `music[]`.
8. Derive the manifest entry:
   - `id`: lowercase filename without extension, non-alphanumeric runs replaced
     by `-`;
   - `path`: `assets/<name>/music/<original-filename>.mp3`;
   - `volume`: `0.1`;
   - `desc`: `Background music`;
   - `mood`: `["general"]`.
9. Halt if the derived `id` or `path` already exists in the manifest.

Do not invent a category, rename a duplicate file automatically, or update
`src/templates/registry.ts`.

Use `--file` when `tmp-music/` contains multiple mp3 files or when the user
wants to select one by name.

## Completion

After the script succeeds, report:

- category;
- generated `id`;
- generated manifest `path`;
- copied file path;
- manifest path.
