# Contexa Desktop

The Contexa desktop app — Tauri v2 + Rust + React + TypeScript + Vite.

For the product vision and scope, see the [root README](../README.md).

## Prerequisites

- [Bun](https://bun.sh)
- Rust toolchain (`rustup`) — required by Tauri
- Platform dependencies per the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting started

```bash
bun install            # install dependencies
bun run tauri dev      # run the desktop app in dev mode
```

Other commands:

```bash
bun run dev            # frontend only (Vite dev server)
bun run build          # type-check + build the frontend
bun run tauri build    # build the distributable desktop bundle
```

## Structure

```text
desktop/
├── src/               # React frontend
│   ├── App.tsx        # main UI (currently scaffold)
│   └── main.tsx       # entry point
└── src-tauri/         # Rust / Tauri backend
    ├── src/lib.rs     # Tauri commands
    ├── tauri.conf.json
    └── capabilities/  # permission capabilities
```

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).
