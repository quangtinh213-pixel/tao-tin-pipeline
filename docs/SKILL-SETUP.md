# /setup - Environment Setup

## Trigger

Run when the user types `/setup`.

## Support Matrix

The setup must detect the current OS without asking the user.

| Platform | Support level | Notes |
|---|---|---|
| macOS 14+ | Supported | Intel and Apple Silicon |
| Windows 11+ / Windows Server 2019+ | Supported | Run in PowerShell or Command Prompt; restart the shell after system installs when PATH does not refresh |
| Ubuntu 22.04 / 24.04 | Supported | x86-64 or arm64 |
| Debian 12 / 13 | Supported | x86-64 or arm64 |
| Fedora / RHEL / Arch / other Linux | Best effort | Node and ffmpeg may install, but the pinned Playwright version does not officially guarantee these distributions |

WSL is treated as Linux. Do not run Linux package-manager commands from native
Windows.

## Prerequisites

- Internet access to npm, Playwright's browser CDN, TTS/STT APIs, and public
  demo URLs.
- Permission to install system packages:
  - macOS: permission to install Homebrew packages.
  - Windows: an Administrator terminal may be required for `winget` or Chocolatey.
  - Linux: `sudo` access.
- At least 2 GB free disk space for Node packages, Chromium, and render output.

## Required Versions And Tools

| Tool | Requirement | Why |
|---|---|---|
| Node.js | 20.x, 22.x, or 24.x | Required by the pinned Playwright toolchain |
| npm | Installed with Node.js | Installs project dependencies and runs CLIs |
| Chromium for Playwright | Installed from the project's Playwright version | Required by `creative/demo-scroll` |
| ffmpeg | Available on `PATH` | Required when Gemini TTS returns PCM audio |

## Execution Contract

`/setup` is a terminal workflow: once invoked, continue until the complete
toolchain is verified or a genuinely unrecoverable blocker is reached. The user
must not need to type "continue setup" after approving a command.

Follow these rules:

1. The `/setup` request authorizes the normal prerequisite and project
   installation actions listed in this document. Do not ask a separate chat
   clarification before presenting the platform's required approval prompt.
2. Treat an approval prompt as a pause inside the current setup run, not as an
   error or completion boundary. Immediately continue from the next incomplete
   check after the approved command returns.
3. Use the execution environment's native approval/escalation mechanism when a
   required command needs network access, writes outside the project sandbox,
   invokes a system package manager, or was denied by the sandbox.
4. For commands that are known in advance to require system-level access
   (`brew`, `winget`, `choco`, `sudo apt`, `dnf`, `pacman`, and Playwright
   `--with-deps`), request the narrowly scoped approval before running them.
5. When a required sandboxed command fails with a likely permission, DNS,
   registry/CDN, or network restriction, retry the same command through the
   approval mechanism. Do not merely report the sandbox failure.
6. Request reusable, narrowly scoped command approval when the host supports it,
   for example `npm install`, `npx playwright install`, or the selected package
   manager command. Never request blanket shell or arbitrary-script permission.
7. Re-check every completed prerequisite before acting, and skip work that is
   already valid. This makes setup safe to resume after approval, terminal
   restart, agent interruption, or a repeated `/setup`.
8. A non-zero exit is diagnostic input, not an automatic reason to stop. Apply
   the recovery ladder below, then rerun the failed verification and continue.
9. Do not ask the user to pre-authorize all out-of-sandbox work in chat. Trigger
   approval only for the concrete command that needs it.

The workflow may stop only when it needs an action that cannot be completed by
the agent or approval mechanism, such as entering an administrator password in
an inaccessible prompt, restarting the terminal to refresh `PATH`, freeing disk
space, resolving an unsupported platform/package-manager problem, or fixing a
persistent upstream outage after retries.

## Steps

### 1. Detect Platform

Detect `darwin`, `win32`, or Linux. On Linux, read `/etc/os-release` and
classify Debian/Ubuntu, Fedora/RHEL, Arch, or unknown.

If the platform is outside the supported matrix, report that setup is best
effort before continuing.

### 2. Install Or Upgrade Node.js

Verify:

```text
node --version
npm --version
```

Node must be major version 20, 22, or 24. Install an LTS release when Node is
missing or unsupported.

| Platform | Install command |
|---|---|
| macOS | `brew install node@22` |
| Windows | `winget install --id OpenJS.NodeJS.LTS -e` |
| Windows fallback | `choco install nodejs-lts -y` |
| Debian/Ubuntu | Install Node.js 22 through NodeSource, then `sudo apt-get install -y nodejs` |
| Fedora/RHEL | `sudo dnf install -y nodejs npm` |
| Arch | `sudo pacman -S --noconfirm nodejs npm` |

On Windows, if a new `node` command is not visible after installation, restart
the terminal and resume setup. Do not report success until `node --version` and
`npm --version` work in the current shell.

### 3. Install ffmpeg

Skip installation when `ffmpeg -version` already succeeds.

| Platform | Install command |
|---|---|
| macOS | `brew install ffmpeg` |
| Windows | `winget install --id Gyan.FFmpeg -e` |
| Windows fallback | `choco install ffmpeg -y` |
| Debian/Ubuntu | `sudo apt-get update` then `sudo apt-get install -y ffmpeg` |
| Fedora/RHEL | Install ffmpeg from the configured distribution repositories |
| Arch | `sudo pacman -S --noconfirm ffmpeg` |

Verify `ffmpeg -version` after installation. On Windows, restart the terminal if
the installer updated PATH.

### 4. Install Project Packages

Run from the project root:

```text
npm install
```

Use the lockfile already in the repository. Diagnose a non-zero exit using the
recovery ladder below.
If the failure is caused by sandboxed network access or filesystem permission,
request approval and retry. For transient npm registry errors, retry once after
approval before classifying the issue as an upstream outage.

### 5. Install Chromium

Chromium is required for `scripts/record-demo.mjs`.

- macOS and Windows:

```text
npx playwright install chromium
```

- Supported Linux distributions:

```text
npx playwright install --with-deps chromium
```

`--with-deps` may invoke the Linux package manager and require `sudo`. For
best-effort Linux distributions, try `npx playwright install chromium`, report
missing shared-library errors clearly, and do not claim full support.

Browser downloads commonly require network access outside a restricted sandbox.
Request approval and retry automatically when the sandboxed download fails.
On supported Linux, request approval for `--with-deps` before execution because
it is expected to install system libraries.

Re-run this step after upgrading Playwright because each Playwright version
requires matching browser binaries.

### 6. Verify The Toolchain

All checks below must pass:

```text
node --version
npm --version
ffmpeg -version
npx playwright --version
npx playwright install --list
npx remotion versions
npx tsc --noEmit
npm test
```

Confirm that the Playwright browser list includes Chromium. A successful npm
install alone is not sufficient.

### 7. Create `.env`

If `.env` does not exist, copy `.env.example` using a filesystem API when
available. Shell-specific fallbacks:

- macOS/Linux: `cp .env.example .env`
- Windows PowerShell: `Copy-Item .env.example .env`
- Windows Command Prompt: `copy .env.example .env`

Do not overwrite an existing `.env`.

Required configuration:

| Variable | Required | Description |
|---|---|---|
| `ASPECT_RATIO` | No | `9:16` default or `16:9` |
| `THEME` | No | `dark` default or `light` |
| `SHOW_SUBTITLES` | No | `true` default |
| `ELEVENLABS_API_KEY` | No* | Primary TTS provider |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID |
| `GEMINI_API_KEY` | No* | Fallback TTS provider |
| `GEMINI_TTS_VOICE` | No | Gemini voice, default `Achird` |
| `EDGE_TTS_VOICE` | No | Edge TTS voice (last-resort, no key; needs `edge-tts` + ffmpeg), default `vi-VN-NamMinhNeural` |
| `GROQ_API_KEY` | No* | Primary STT provider |
| `GROQ_STT_MODEL` | No | Groq STT model, default `whisper-large-v3-turbo` |
| `STT_API_KEY` | No* | Fallback api.stt.ai Bearer token |
| `STT_LANGUAGE` | No | STT language, default `vi` |

At least one TTS key is required before `/gen-video`. Provider priority is
ElevenLabs, then Gemini.
At least one STT key is required before `/gen-video`. Provider priority is
Groq, then api.stt.ai.

## Error Handling

Use this recovery ladder for every failed required step:

1. Capture the exit code and concise stderr without exposing secrets.
2. Classify the failure as sandbox/permission, transient network, missing
   prerequisite, PATH refresh, unsupported platform, or deterministic project
   failure.
3. For sandbox/permission or likely restricted-network failures, request scoped
   approval, rerun the exact command, and continue automatically after approval.
4. For a transient registry/CDN failure, retry once with approval. Do not loop
   indefinitely.
5. For a missing prerequisite, install it using the platform fallback and then
   return to the failed step.
6. For a verification failure, repair the responsible step and rerun that check,
   followed by the complete Step 6 verification set.
7. Stop only for one of the genuine blockers listed in the Execution Contract.

Specific cases:

- Unsupported Node major version: install a supported LTS release and recheck.
- System package installation fails inside the sandbox: retry through scoped
  approval. If the approved command still fails, try the documented package
  manager fallback before stopping.
- Chromium browser download fails: retry through scoped approval. Distinguish a
  CDN/network failure from missing Linux shared libraries; use `--with-deps` for
  the latter on supported Linux.
- `npm install` fails: retry with scoped approval for permission, DNS, registry,
  or sandbox failures. Deterministic dependency-resolution errors require
  diagnosis; do not repeatedly run the same command.
- A command becomes available only after PATH refresh: this is a valid blocker.
  Report completed steps and the exact first command to resume after terminal
  restart.
- Do not report setup success when any toolchain verification command fails.
- Do not end the turn immediately after an approval succeeds; continue setup.

When blocked, report a resumable checkpoint containing:

- steps already verified;
- the first incomplete step;
- the exact blocker and attempted recovery;
- the command/check that should run first when setup resumes.

## Output

Report:

- Detected OS and Linux distribution when applicable.
- Support level: supported or best effort.
- Node.js, npm, ffmpeg, Playwright, Chromium, and Remotion verification status.
- Whether `.env` was created or preserved.
- Reminder to fill API keys before `/gen-video`.
