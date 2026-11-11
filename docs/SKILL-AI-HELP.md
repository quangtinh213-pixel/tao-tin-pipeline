# /ai-help — List Available AI Commands

## Trigger

Run when the user types:

```text
/ai-help
```

## Behavior

List every slash command supported by this project with a concise Vietnamese
description and usage example.

Read `AGENTS.md` and the canonical `docs/SKILL-*.md` files as needed. Do not
run setup, generation, rendering, or asset mutation commands.

## Output Format

Return a Markdown table with exactly these columns:

| command | usage | description |
|---|---|---|

Include these commands:

- `/setup`
- `/gen-video`
- `/templates`
- `/update-bg-music`
- `/update-template-voice`
- `/add-music`
- `/sync-templates`
- `/update-logo`
- `/update-config`
- `/update-version`
- `/tao-tin`
- `/tao-video-dai`
- `/ai-help`

Keep descriptions short and practical. Mention required staging folders for
asset commands:

- `/add-music`: put mp3 files in `tmp-music/`
- `/sync-templates`: put purchased template package folders in `load-templates/`
- `/update-logo`: put png files in `tmp-logo/`

After the table, add one short note:

```text
Các command chi tiết đều có hướng dẫn trong docs/SKILL-*.md.
```

## Constraints

- Do not modify files.
- Do not execute any workflow command.
- Do not list placeholder or commented-out commands.
