# Creative Scene Quality Contract

Use this contract for `creative/free-style` and for custom scenes in hybrid
templates. It defines output quality, not a mandatory layout.

## Principle

Creative scenes are judged by whether they communicate clearly and look
intentional. They are not required to use cards, a fixed wrapper, a target fill
percentage, continuous loops, or a fixed stagger interval.

Whitespace, stillness, and text-only compositions are valid when they support the
idea.

## Required Outcomes

Every scene must satisfy these outcomes:

1. **One core idea:** a viewer can identify the scene's focus quickly.
2. **Clear hierarchy:** one element or phrase is visually dominant.
3. **Content-driven treatment:** composition and motion reflect the narration.
4. **Readable timing:** information appears in an order viewers can follow.
5. **Intentional composition:** whitespace and density feel deliberate.
6. **Safe presentation:** no overflow or collisions with subtitles/watermark.
7. **Meaningful progression:** the beginning, middle, and end differ for a reason,
   unless intentional stillness is explicitly the concept.
8. **Language fidelity:** viewer-facing text preserves the source language and
   diacritics.

For Vietnamese videos, all rendered titles, labels, captions, chips, stamps,
chart labels, and UI mockup text must use Vietnamese with correct diacritics.
Do not convert Vietnamese to ASCII-only text. English is allowed only for
brands, product/code terms, quoted foreign-language UI, or terms deliberately
retained by the narration.

## Text-Only Scenes

Text-only scenes are allowed. They must treat typography as the visual concept,
not display a static paragraph.

Useful treatments include:

- Progressive sentence construction.
- A dominant keyword changing scale, weight, color, or position.
- Semantic motion: "decrease" contracts, "growth" expands, "disconnect"
  separates.
- Editorial composition using headline, number, source, and whitespace.
- Mask, wipe, replacement, strike-through, or before/after typography.
- Intentional stillness after one strong reveal to leave reading time.

Avoid:

- Long paragraphs appearing at once.
- Several equally dominant text blocks.
- Decorative motion unrelated to the words.

## Visual Explanation

When narration describes a system, comparison, number, process, interface, or
relationship, prefer a visual representation over explanatory prose:

- metrics and trends: counter, chart, progress, scale comparison
- systems and relationships: diagram, graph, flow, connected nodes
- process and time: steps, timeline, transformation
- software and products: terminal, browser, phone, device, UI abstraction
- contrast: split composition, morph, before/after
- lists: icon grid, grouped labels, sequential reveal

These are options, not mandatory components. Create a content-specific visual
when a generic pattern would weaken the idea.

## Motion Direction

Motion must have a narrative purpose:

- Entrance reveals reading order or causality.
- Transformation demonstrates change.
- Movement between objects demonstrates flow or relationship.
- Exit or transition prepares the next idea.

Do not animate every element merely to keep the screen moving. Continuous motion
is optional. A scene may settle when viewers need time to understand or read.

### Motion Budget By Scene Purpose

| Purpose | Appropriate motion |
|---|---|
| Hook | One strong reveal or transformation |
| Explanation | Two to four progressive information beats |
| Data | Values, chart geometry, or comparisons animate meaningfully |
| Text/emotional | Kinetic typography or intentional stillness |
| Ending | One clear reveal followed by readable hold time |

Timing values should respond to scene duration and narration. Do not enforce a
universal stagger interval.

## Creative Diversity

Across a video:

- Avoid repeating complete scene compositions.
- Vary visual metaphors and motion patterns when the content changes.
- Reuse primitives and tokens for cohesion, not one generic full-scene layout.
- Do not force every scene to contain a card, icon, particles, or a diagram.

## Scene Brief Requirements

For each creative/custom scene, the spec should state:

- `coreIdea`: what viewers must understand
- `visualConcept`: how the scene communicates it
- `dominantElement`: the primary visual focus
- `informationOrder`: reveal/read order
- `motionIntent`: why elements move or remain still
- `safeAreaNotes`: relevant watermark/subtitle constraints

Exact coordinates and animation implementation belong in code unless the
composition requires them to communicate the design.

## Quality Gate

Before accepting a scene, answer:

1. Is the dominant visual immediately clear?
2. Does the visual communicate part of the idea without narration?
3. Does text appear at a readable pace?
4. Is whitespace intentional rather than accidental?
5. Does every animation support meaning or attention?
6. Are the first, middle, and final inspected frames visually purposeful?
7. Are watermark, subtitles, and frame edges clear?
8. Does every viewer-facing string preserve the source language and Vietnamese
   diacritics when applicable?

Hard gates:

- Core idea and dominant visual are understandable.
- Text is readable.
- Viewer-facing text preserves the source language and required diacritics.
- No overflow or collision with watermark/subtitles.

A scene must pass all hard gates and at least five of the seven questions.
Intentional exceptions may apply only to soft checks and must be documented in
the scene brief.
