# /update-version — Apply Version Update Instructions

## Trigger

Run when the user types:

```text
/update-version
```

## Input File

Read:

```text
update-version/update-version.md
```

The user will provide this file when an update is needed.

## Status Guard

Before doing any work, check whether the file is already marked updated:

```bash
npm run update-version
```

If the command prints `Already updated`, stop immediately and report that the
update has already been applied.

The file is considered completed when one of these markers appears near the top:

```text
status: updated
status updated
<!-- status: updated -->
```

## Execution

If the status check reports pending instructions:

1. Open and read `update-version/update-version.md`.
2. Follow the instructions in that file exactly.
3. Do not invent extra update steps.
4. Run whatever verification the file requests.
5. If the instructions are completed successfully, mark the file updated:

```bash
npm run update-version -- --mark-updated
```

If any instruction is unclear or blocked, do not mark the file updated. Report
the blocker to the user.

## Completion

Report:

- whether the update was skipped because it was already updated;
- or what was changed and that `update-version/update-version.md` is now marked
  `status: updated`.
