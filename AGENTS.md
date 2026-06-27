# AGENTS.md

For AI coding agents working in this repository. This file is repo-wide; app-specific
guidance lives in the nearest nested `AGENTS.md` (e.g. [`desktop/AGENTS.md`](desktop/AGENTS.md)).

## Repository layout

| Path | What |
|------|------|
| `README.md` | Product overview (human-facing) |
| `AGENTS.md` | Repo-wide agent constraints (this file) |
| `desktop/` | The Contexa desktop app — read [`desktop/AGENTS.md`](desktop/AGENTS.md) before working there |

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
- `AGENTS.md` is agent-facing: behavioral constraints and technical conventions only — no product capability or architecture narrative, and no reference to it from `README.md`.
- Keep this root file repo-wide. Put stack, commands, and code conventions for a subproject in that subproject's own `AGENTS.md`.
