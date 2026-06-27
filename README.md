# Contexa

Let every project run in the right context.

Contexa is a local-first, project-scoped development context manager — it unifies AI agent rules, MCP configurations, Git identity, SSH profiles, environment references, and tool launch settings for a project, while keeping security boundaries clear: no secrets stored, no global configuration modified, all changes auditable and diffable.

## Why it's needed

AI coding tools are rapidly fragmenting. A real project may depend on:

- **Agent rules** — `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions
- **MCP configs** — `.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`
- **Git / SSH** — `user.name`, `user.email`, commit signing, SSH identity
- **Environment declarations** — `.envrc`, `mise.toml`, `devbox.json`
- **Tool launch** — Terminal, Codex, Claude Code, Cursor, VS Code

Existing tools usually cover only one layer. Contexa's entry point is: **a complete development context console for the current project**.

## Product principles

| Principle | Description |
|-----------|-------------|
| Project-scoped | Manage only the current project, no global config center |
| Local-first | Work on the local machine and within the project directory first |
| Reference-only | Store paths, variable names, provider references — never store secrets themselves |
| Audit-before-apply | Show diffs before writing; config changes are auditable and reversible |
| macOS-first | macOS first, architecture preserves room for Windows/Linux expansion |

## Scope

**Will do:**

- Scan agent rules, MCP configs, env, Git/SSH configurations in the project
- View and edit project rules and MCP configs in-place, no intermediate files generated in the project
- Manage project-level MCP server configs, storing only references for sensitive parameters
- Manage Git identity / SSH profile references, never store private keys
- Launch development tools from Contexa and inject the current project context
- Provide diff and validation for all file writes

**Won't do:**

- Host user data, store plaintext secrets, tokens, or private keys
- Modify `~/.ssh/config`, `~/.gitconfig`, or other global configurations by default
- Replace 1Password, Doppler, Infisical, direnv, mise, or Devbox
- Do cloud sync, team backends, or agent orchestration

## Architecture direction

Contexa is layered from the user-facing console down to the project scanner:

| Layer | Responsibility |
|-------|----------------|
| UI Console | Status, editing, diff, health check |
| Secure Launcher | Inject context into the current process tree only |
| Policy / Diff / Validation | Write-scope, sensitive-data, and drift checks |
| Adapter Engine | Read project files and edit tool configs in place |
| Project Scanner | Discover rules / MCP / env / Git / SSH |

## Roadmap

| Phase | Goal |
|-------|------|
| 0 | Tauri app skeleton, product docs, agent collaboration docs ✓ |
| 1 | Project selection, project scanning, config dashboard |
| 2 | Unified rule viewing and in-place editing of AGENTS.md / CLAUDE.md / Cursor rules / Copilot instructions |
| 3 | MCP config viewing, generation, validation, and diff |
| 4 | Project-level Git identity / SSH profile references and launcher |
| 5 | Health check, templates, team policy, local audit reports |

## Development

Tech stack: Tauri v2 + Rust + React + TypeScript + Vite. Package manager: Bun.

## License

[GNU Affero General Public License v3.0 or later](LICENSE) (AGPL-3.0-or-later). © 2026 Bonjour Studio.

You may use, study, modify, and share this project freely. If you distribute it — or run a modified version as a network service — you must release your full source under the same license. This keeps Contexa and every derivative open; it cannot be turned into a closed-source product.

