# /update-config — Update Environment Configuration

## Trigger

Run when the user types:

```text
/update-config --key <ENV_KEY> --value <value>
```

Example:

```text
/update-config --key ELEVENLABS_API_KEY --value abc-xyz-kkk
```

## Behavior

Update the project root `.env` file. If `.env` does not exist, create it. If the
key already has an active `KEY=value` line, replace that line. If not, append a
new line at the end.

Run:

```bash
npm run update-config -- --key <ENV_KEY> --value <value>
```

Rules:

1. `ENV_KEY` must use uppercase letters, numbers, and underscores, and must
   start with a letter or underscore.
2. Do not update commented examples such as `# ELEVENLABS_API_KEY=...`.
3. Do not print the provided value back to the user, because it may be a secret.
4. Preserve all unrelated lines and comments in `.env`.
5. Do not update `.env.example` unless the user explicitly asks.

## Completion

Report only:

- whether the key was added or updated;
- the key name;
- the target file `.env`.
