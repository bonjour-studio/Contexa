# AGENTS.md — desktop app

Agent guidance for the Contexa desktop app. Repo-wide constraints (security red lines,
documentation conventions) live in the root [`../AGENTS.md`](../AGENTS.md).

## Tech stack

| Layer | Choice |
|-------|--------|
| App shell | Tauri v2 |
| Backend | Rust (`src-tauri/`) |
| Frontend | React 19, TypeScript, Vite (`src/`) |
| Package manager | Bun |

Do not switch to npm, pnpm, or yarn without an explicit task. A switch must update the
Tauri config, the lockfile, and the docs together.

## Commands

Run from `desktop/`:

```bash
bun install            # install dependencies
bun run dev            # frontend dev server (Vite)
bun run tauri dev      # full Tauri app in dev mode
bun run build          # type-check + build frontend
bun run tauri build    # build the desktop bundle
```

Rust-only check:

```bash
cd src-tauri && cargo check
```

There is no test script yet. Add package scripts and update the docs when you introduce tests.

## Code map

| Path | What |
|------|------|
| `src/` | React frontend |
| `src/App.tsx` | Template UI — replace when building the real product UI |
| `src-tauri/src/lib.rs` | Tauri commands (currently the template `greet`) |
| `src-tauri/tauri.conf.json` | App config, bundle identifier, dev/build hooks |
| `src-tauri/capabilities/` | Tauri permission capabilities |

The current UI and Rust command are still Tauri scaffold — do not infer product goals from them.

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

## Verification

| Change scope | How to verify |
|--------------|---------------|
| Frontend | `bun run build` |
| Rust | `cd src-tauri && cargo check` |
| Tauri config / capabilities / plugins | `bun run tauri build`; if slow or the environment is missing, say so and note it is unverified |

Commit `src-tauri/Cargo.lock` once it is generated — this is an application, not a library.
