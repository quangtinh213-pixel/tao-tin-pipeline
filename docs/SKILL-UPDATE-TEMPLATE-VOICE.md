# /update-template-voice — Update Template TTS Voice

## Trigger

Run when the user types:

```text
/update-template-voice --template <template-id-or-name> [--gemini <voice-name>] [--elevenlabs <voice-id>]
```

At least one provider flag is required. The user may pass one provider or both
providers in the same command.

Examples:

```text
/update-template-voice --template pexels-podcast-dark --gemini Achird
/update-template-voice --template human-insight/pexels-podcast-dark --elevenlabs K7ewtjKRNtwwt3lKQ6M0
/update-template-voice --template pexels-podcast-dark --gemini Achird --elevenlabs K7ewtjKRNtwwt3lKQ6M0
```

## Behavior

This command updates the selected template's `voice` configuration in
`src/templates/registry.ts`.

Run:

```bash
npm run update-template-voice -- --template <template-id-or-name> [--gemini <voice-name>] [--elevenlabs <voice-id>]
```

The script resolves template input as follows:

1. exact full ID, for example `human-insight/pexels-podcast-dark`;
2. unique final segment, for example `pexels-podcast-dark`.

The script updates only the provider flags supplied by the user:

- `--gemini <voice-name>` updates `voice.geminiVoice`;
- `--elevenlabs <voice-id>` updates `voice.elevenLabsVoiceId`;
- passing both flags updates both fields.

If the template has no `voice` block, the script creates one after
`specDocPath`. If the template name is ambiguous, stop and ask the user to
provide the full template ID.

Do not validate provider IDs by calling remote APIs. This command only updates
local template configuration.

## Completion

After the script succeeds, report:

- the resolved template ID;
- the updated Gemini voice, if supplied;
- the updated ElevenLabs voice ID, if supplied.

Do not run `/gen-video`, regenerate `voice.mp3`, transcribe audio, or render a
video for this command.
