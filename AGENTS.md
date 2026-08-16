# @deepseek-ai/dsh-win-desktop

Windows Desktop bridge plugin for DeepSeek Harness. Zero-dependency install, single `node` command to run.

## Quick Start (Zero-Dependency)

```bash
# Only requires Node.js >= 22
node bin/dsh-win-desktop.bat install
node bin/dsh-win-desktop.bat start
```

## Quick Start (Full Dev)

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

## Installation

```bash
# Zero-dependency (recommended)
node bin/dsh-win-desktop.bat install

# Via dsh CLI
npx -p @deepseek-ai/dsh dsh plugin --profile web add github:deepseek-ai/deepseek-harness-win-desktop
```

## Architecture

| Layer | File | Role |
|-------|------|------|
| Host | `src/host/index.ts` | `WinDesktopService` — HTTP CRUD + Cordis lifecycle |
| Host | `src/host/invariant.ts` | Session lifecycle invariant checks |
| Client | `src/client/app.tsx` | `apply(ctx)` — locale + slot injection |
| Client | `src/client/ui-panel.tsx` | React panel with 3s polling |
| Client | `src/client/slots.ts` | `SlotMap` declaration merge |
| Config | `cordis.patch.yml` | DSH bundle patch overlay |
| Config | `dsh-plugin.json` | Plugin manifest |
| CLI | `scripts/standalone-dsh.cjs` | Zero-dep installer + launcher |

## Key Contracts

- **HTTP API**: `GET /health`, `GET /sessions`, `POST /sessions`, `DELETE /sessions/:id`
- **Events**: `winDesktop:session:start`, `winDesktop:session:stop`
- **Slots**: `win-desktop.panel` (single/root), `win-desktop.session` (list/session)
- **Locale**: namespace `winDesktop`, keys `title`, `newSession`, `noSessions`, etc.