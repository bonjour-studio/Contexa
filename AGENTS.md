# AGENTS.md

For engineering automation working in this repository. This file is repo-wide; app-specific
guidance lives in the nearest nested `AGENTS.md` (e.g. [`desktop/AGENTS.md`](desktop/AGENTS.md)).

## Repository layout

| Path | What |
|------|------|
| `README.md` | Product overview (human-facing) |
| `AGENTS.md` | Repo-wide automation constraints (this file) |
| `harness/` | Harness Engineering state, verification, and handoff artifacts |
| `desktop/` | The Contexa desktop app — read [`desktop/AGENTS.md`](desktop/AGENTS.md) before working there |

## Harness Engineering workflow

This repository uses Harness Engineering artifacts under `harness/`. The goal is
not to produce code as quickly as possible, but to leave every session in a state
where the next engineering session can continue without guessing.

### Start-of-session flow

Before writing code:

1. Use `pwd` to confirm the current directory.
2. Read `harness/progress.md` for the latest verified state and next step.
3. Read `harness/feature_list.json` and choose the highest-priority unfinished feature.
4. Use `git log --oneline -5` to inspect recent commits.
5. Run `./harness/init.sh`.
6. Before starting a new feature, run the required smoke test or end-to-end verification.

If baseline verification is already failing, fix the baseline first instead of
stacking new feature work on top of a broken state.

### Working rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was written.
- Do not expand into other features unless a narrow fix is required to remove the current blocker.
- Do not silently weaken verification rules while implementing.
- Prefer persistent repo files over chat history as the source of truth.

### Required harness files

- `harness/feature_list.json`: single source of truth for feature status
- `harness/progress.md`: session progress and current verified state
- `harness/init.sh`: unified startup and verification entry point
- `harness/session-handoff.md`: handoff summary for longer sessions

### Definition of Done

A feature is complete only when all of the following are true:

- The target behavior is implemented.
- The required verification was actually run.
- Evidence is recorded in `harness/feature_list.json` or `harness/progress.md`.
- The repository can still restart through the standard startup path.

### Wrap-up

Before ending a session:

1. Update `harness/progress.md`.
2. Update `harness/feature_list.json`.
3. Record unresolved risks or blockers.
4. Ensure the next session can directly run `./harness/init.sh`.
5. Stage, commit, or push only when the user explicitly asks for it.

## Security red lines

Hard constraints — pause and explain the risk if a task requires crossing them:

- Do not generate, store, copy, or display real private keys.
- Do not commit API keys, tokens, or passwords to the repository.
- Do not run `git config --global ...` or directly modify `~/.ssh/config` and other global configs.
- Do not install global CLIs or system services by default.
- Do not paste sensitive file contents from the user's home directory into final responses.
- Do not stage, commit, or push unless explicitly asked.

## Documentation conventions

- `README.md` is human-facing: product positioning, scope, roadmap.
- `AGENTS.md` is automation-facing: behavioral constraints and technical conventions only — no product capability or architecture narrative, and no reference to it from `README.md`.
- Keep this root file repo-wide. Put stack, commands, and code conventions for a subproject in that subproject's own `AGENTS.md`.
