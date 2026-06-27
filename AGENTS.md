# AGENTS.md

For AI coding agents working in this repository.

## Tech stack

| Layer | Choice |
|-------|--------|
| App shell | Tauri v2 |
| Backend | Rust |
| Frontend | React 19, TypeScript, Vite |
| Package manager | Bun |

## Security red lines

Hard constraints — pause and explain the risk if a task requires crossing them:

- Do not generate, store, copy, or display real private keys.
- Do not commit API keys, tokens, or passwords to the repository.
- Do not run `git config --global ...` or directly modify `~/.ssh/config` and other global configs.
- Do not install global CLIs or system services by default.
- Do not paste sensitive file contents from the user's home directory into final responses.
- Do not stage, commit, or push unless explicitly asked.

## Frontend conventions

- Centralize Tauri API calls into a clear service/client layer, not scattered across the component tree.
- UI should emphasize project status, risks, diff, and next actions — not stack generic settings forms.
- TypeScript types should express domain concepts: project, adapter, rule target, mcp server, ssh profile, launch profile.
- Do not hardcode real paths, usernames, emails, or tokens into example UI — use obvious placeholders.

## Rust / Tauri conventions

- All filesystem, shell, and launcher capabilities enter through Rust commands; the frontend only makes controlled requests.
- Canonicalize project paths and verify that write targets remain within the user-selected project directory.
- Use allowlists or structured parameters for shell commands — never concatenate arbitrary strings.
- Keep Tauri permissions minimal. Explain the purpose when adding plugins or capabilities.
- Do not read or print private keys, tokens, or `.env` plaintext values.
- File writes should support dry-run/diff first, then apply.

## Verification requirements

When changing docs, verify that Markdown structure and content match the current repository state. Build verification for the desktop app will be added once application code is merged.

## Documentation conventions

`AGENTS.md` records agent behavioral constraints and technical conventions only — it does not describe product capabilities or architecture direction. Those belong in `README.md`.
