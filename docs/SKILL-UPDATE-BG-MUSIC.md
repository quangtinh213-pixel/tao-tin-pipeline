# /update-bg-music — Update Template Default Background Music

## Trigger

Run when the user types:

```text
/update-bg-music --template <template-id-or-name> --music <music-file-or-path>
```

Examples:

```text
/update-bg-music --template current-affairs-dark --music news-ambient-01.mp3
/update-bg-music --template news/current-affairs-dark --music assets/news/music/news-ambient-01.mp3
```

## Behavior

This command updates `defaultBgMusic` for one template in
`src/templates/registry.ts`.

Run:

```bash
npm run update-bg-music -- --template <template-id-or-name> --music <music-file-or-path>
```

The script resolves inputs as follows:

1. Template matching:
   - exact full ID, for example `news/current-affairs-dark`;
   - unique final segment, for example `current-affairs-dark`.
2. Music matching:
   - exact manifest `music[].path`;
   - filename basename, for example `music-bg-2.mp3`;
   - manifest `music[].id`.
3. Search order:
   - first, the selected template's `assetManifestPath`;
   - then, every other `public/assets/**/manifest.json`.

If the music file is not found, stop and report that no matching music asset was
found. Do not invent paths and do not update `registry.ts`.

If the template name is ambiguous, stop and ask the user to provide the full
template ID.

## Completion

After the script succeeds, report:

- the resolved template ID;
- the new `defaultBgMusic` path;
- the manifest where the track was found.

Do not run `/gen-video` and do not render a video for this command.
