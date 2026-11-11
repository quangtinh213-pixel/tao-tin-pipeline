# /sync-templates — Sync Purchased Template Packages

## Trigger

Run when the user types:

```text
/sync-templates
/sync-templates --package <package-folder>
```

Template packages must be copied into `load-templates/` before running this
command. Each package folder must contain `template-package.json`.

## Package Contract

Every importable package is self-describing:

```text
load-templates/<package-id>/
├── template-package.json
├── README.md
├── docs/
├── src/
└── public/
```

The package manifest must include:

```json
{
  "schemaVersion": 1,
  "packageId": "news-real-estate-luxury-editorial",
  "version": "1.0.0",
  "templateId": "news/real-estate-luxury-editorial",
  "registryEntry": {},
  "registryEntryText": "{ ... }",
  "files": [
    {"from": "docs/templates/news/example.md", "to": "docs/templates/news/example.md"}
  ],
  "assets": {
    "manifests": [
      {"from": "public/assets/news/manifest.json", "to": "public/assets/news/manifest.json"}
    ]
  },
  "docs": {
    "referenceFiles": [
      {"from": "docs/SKILL-GEN-VIDEO.md", "to": "docs/SKILL-GEN-VIDEO.md"}
    ]
  },
  "dependencies": {
    "npm": {
      "some-package": "^1.0.0"
    }
  },
  "env": [
    {
      "key": "PEXELS_API_KEY",
      "required": false,
      "description": "Used when this template fetches Pexels videos."
    }
  ]
}
```

`registryEntryText` preserves the exact TypeScript registry object. If it is
missing, the sync script rebuilds the entry from `registryEntry`.

New exporters must resolve and validate documentation dependencies before
writing the package, then flatten them into `files` and `docs.referenceFiles`.
This keeps the sync-side schema unchanged: packages exported by newer versions
remain installable by existing schema-v1 sync implementations, and packages
exported before dependency discovery was added remain installable as before.

New packages may also include optional `compatibility` metadata and versioned
helpers under `scripts/capabilities/`. Legacy importers may ignore the metadata;
the helper files remain installable through the schema-v1 `files` list.

## Behavior

Run:

```bash
npm run sync-templates
npm run sync-templates -- --package <package-folder>
npm run sync-templates -- --package <package-folder> --dry-run
```

The script:

1. Reads every package under `load-templates/`, or the selected package only.
2. Skips packages already recorded in `.template-sync-state.json` by
   `<packageId>@<version>`.
3. Performs a read-only preflight of paths, checksums, compatibility, file
   ownership, registry metadata, manifests, env keys, and dependencies. No
   project file is changed when preflight finds a dangerous conflict.
4. Compares registry entries and JSON manifests semantically, so formatting and
   object-key order do not create false conflicts.
5. Uses the previously installed file hashes in `.template-sync-state.json` to
   distinguish a safe package upgrade from local user edits. Text files changed
   both locally and by the package receive a three-way merge.
   For legacy packages without ownership metadata, only files located under the
   package's exact `src/templates/<templateId>/` directory are package-exclusive;
   sibling template files are shared dependencies and preserve the runtime copy.
   Likewise, only the registry entry's exact `specDocPath` is the package's
   template spec; other `docs/templates/` files are reference dependencies. If
   a later package owns one of those docs as its spec, sync promotes the incoming
   canonical spec with a backup instead of treating it as an ownership conflict.
6. Preserves locally edited reference docs and assets when a clean merge is not
   possible. The incoming version is retained under
   `.template-sync-backups/incoming/` for inspection.
7. Namespaces conflicting asset paths and manifest identities with the package
   ID, then rewrites static package references. Identical assets are reused.
8. Merges asset manifests by all available `id`, `path`, and `name`
   identities. Shared notes and unknown shared top-level fields are preserved.
9. Adds or three-way merges the template registry entry. During an upgrade it
   preserves user-modified `voice` and `defaultBgMusic` preferences while still
   accepting new package defaults when the user did not override them.
10. Adds missing env keys to both `.env.example` and `.env` with empty values.
   Never overwrite existing env values.
11. Applies each package as a transaction, installs missing npm dependencies,
    verifies required registry/docs/manifest paths, runs TypeScript validation
    when source files are involved, and rolls back that package on failure.
12. Marks the package synced only after verification succeeds. A failed package
    is reported and isolated while other discovered packages continue syncing.

Use `--skip-install` only for offline inspection. A package that needs missing
dependencies is recorded with `dependenciesPending` and will install them on a
later sync without `--skip-install`.

Use `--dry-run` to print the complete sync plan without changing the project.
Use `--fail-fast` only when automation should stop after the first failed
package; normal batch sync continues with independent packages.

## Completion

After success, report:

- packages synced;
- packages skipped and failed;
- files copied;
- files updated, merged, or locally preserved;
- assets and manifest identities namespaced;
- manifest items added;
- registry entries added or updated;
- env keys added;
- dependencies installed.
- reference docs updated and backed up.

If all discovered packages were already synced, report that no sync work was
needed.

## Error Handling

- Missing `template-package.json`: skip that folder with a short warning.
- Invalid package manifest: halt and report the path.
- Invalid/unsafe path, symlink, or checksum mismatch: reject and make no project
  changes for that package.
- Immutable capability conflict: reject because one version must have exactly
  one content identity.
- Package-exclusive executable code with unmergeable local changes: reject.
  Project-owned shared source is preserved and validated with TypeScript.
- Registry ID owned by another package with different semantics: reject.
- Local executable-source changes that cannot be cleanly three-way merged:
  reject rather than guessing.
- npm install or post-sync verification failure: roll back the package and
  report the command/error.

Rejected packages do not prevent other packages in the same batch from syncing.
The command exits non-zero after the batch when one or more packages failed.

Do not run `/gen-video` automatically after syncing.
