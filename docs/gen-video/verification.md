# Gen Video Verification

Verification is a design step, not only a compile check.

## Required Checks

1. Run:

```bash
npx tsc --noEmit
```

2. Use risk-based frame sampling for creative or custom scenes:
   - Always inspect the middle frame, where the main idea should be visible.
   - Always inspect a late frame, where the final readable state should be clear.
   - Inspect an early frame only when the scene has a complex entrance, delayed
     content, or meaningful first-second behavior.
3. For fixed templates, do not generate verification stills when only
   content/spec/timing changed and the existing template components are reused.
   Rely on TypeScript, tests, timing validation, and final render verification.
   Generate representative stills only if fixed template code, layout behavior,
   media handling, subtitles, safe areas, or transitions changed.
4. Inspect frames immediately before, during, and after a transition only when
   the transition is custom, newly introduced, visually complex, or changed.
   Established template transitions covered by tests do not require repeated
   three-frame inspection at every boundary.
5. Run the repository test command when available.

The normal target is 12-18 inspected frames for a seven-scene creative video,
not an exhaustive frame set. Fixed-template generations with unchanged template
code normally require zero inspected stills. Increase sampling when a scene is
dense, uses browser/video media, has elements near safe-area boundaries, or
fails an initial inspection.

Store verification stills outside the repository, such as an OS temporary
directory. Do not add generated verification frames to the project.

## Inspect For

- Core idea and dominant visual are clear.
- Text is readable and not too dense.
- Animation timing follows narration.
- Early frames are not accidentally empty.
- Late frames provide enough reading time.
- No overflow, clipping, or unintended overlap.
- Meaningful content avoids watermark and subtitle safe areas.
- Contrast remains readable over animated backgrounds.
- Scene compositions are not mechanically repeated.
- Final duration matches the audio-derived `totalFrames`.
- Verify that `audio.txt` exists and matches the rendered layers:
  - `full`: music and transition SFX are audible;
  - `music`: music is present and transition SFX are absent;
  - `sfx`: `video.bgMusic` is `null` and transition SFX are present;
  - `voice-only`: `video.bgMusic` is `null` and generated transition SFX are absent;
  - `template`: the selected template's default audio contract is preserved.

## Weak Scene Signals

Redesign a scene when:

- It is mostly static text without intentional typography.
- Decorative elements do not communicate or support composition.
- Everything appears simultaneously without a reason.
- Motion continues mechanically and distracts from reading.
- Empty space appears accidental.
- The scene only changes copy while reusing another scene's full layout.

## Final Render Gate

Do not render the final video until:

- TypeScript passes.
- Required stills were inspected, when still inspection is required.
- Weak scenes and collisions were fixed.
- Scene durations sum exactly to `totalFrames`.
- Audio, watermark, and subtitles are present as required by the template.
- An explicit audio mode overrides conflicting template-default music/SFX rules.
