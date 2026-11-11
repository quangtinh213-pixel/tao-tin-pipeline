# START_HERE

Entry point for writing `plan.json` (Planner) and `script/script.json`
(Teller). Read this before drafting narration content for either step.

This folder governs **what to say and how to say it**. It does not change
the JSON schemas, timing math, or `--audio` handling defined in
`docs/gen-video/common-pipeline.md` — those stay authoritative.

## Reading order

1. Read this file first.
2. Read `SCRIPT_RULES.md`. This is the base rule; nothing below may override
   it.
3. Read `SCRIPT_PATTERNS.md` to pick the narrative arc that matches the
   story shape (breaking news, explainer, product update, warning, or
   human-interest) — not the visual template category.
4. If the story needs a specific tone, read `STYLE_INDEX.md` and apply
   exactly one style. Blend a second only if the story genuinely needs it.

## Purpose

- Make Planner/Teller output natural spoken Vietnamese: clear, engaging, not
  robotic or summary-like.
- Pick the right tone per story without reading every profile.
- Prevent scope creep from reading too many references and producing a
  diluted script.

## How to apply correctly

- `SCRIPT_RULES.md` is the base rule, always senior to style choice.
- `SCRIPT_PATTERNS.md` only picks the **story shape**: where the hook lands,
  where proof appears, what the middle segments cover.
- `STYLE_INDEX.md` only lends **rhythm, tone, sharpness/softness, closing
  style**.
- Do not blindly imitate a style. If the underlying story is a calm briefing,
  do not import event-style hype energy just because it reads more
  exciting.

## Short formula

- 70%: clarity, spoken rhythm, one idea per segment
- 30%: the chosen tone color

## Do not

- Do not read every style profile and blend randomly.
- Do not prioritize style over clarity.
- Do not write like an article summary.
- Do not write generic, neutral "AI voice" narration.
