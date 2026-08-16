# @deepseek-ai/dsh-win-desktop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![DSH Plugin](https://img.shields.io/badge/DSH-plugin-0.1.0-informational.svg)](https://github.com/deepseek-ai/deepseek-harness)

> **DeepSeek Harness Windows Desktop Plugin** — A zero-dependency DSH plugin that bridges Windows desktop sessions via a local HTTP API. Install with a single `node` command, no pnpm or dsh CLI required.
>
> **DeepSeek Harness Windows 桌面插件** —— 零依赖 DSH 插件，通过本地 HTTP 服务桥接 Windows 桌面会话。一条 `node` 命令完成安装，无需 pnpm 或 dsh CLI。

## 350-Word Summary

`@deepseek-ai/dsh-win-desktop` is a DeepSeek Harness (DSH) plugin that provides a Windows desktop session bridge. It runs a local HTTP server on port 8765 (configurable) that manages desktop sessions with full CRUD endpoints (`GET /health`, `GET /sessions`, `POST /sessions`, `DELETE /sessions/:id`). The plugin follows the official DSH plugin architecture: a host-side `WinDesktopService` extending Cordis `Service` with lifecycle-managed HTTP routing, and a client-side React panel injected into the DSH UI via the slot system (`win-desktop.panel`). It ships pre-built JavaScript in `lib/` so users need only Node.js >= 22 to install and run — no pnpm, no TypeScript toolchain, no dsh CLI. The included `bin/dsh-win-desktop.bat` launcher provides `install`, `start`, `status`, `stop`, and `doctor` commands that copy the bundle to `DSH_HOME/plugins/` and auto-inject the Cordis patch into the web profile. Bilingual support (English/中文) is built in via the DSH locale system. The plugin is MIT-licensed, uses `schemastery` for config validation, and includes an invariant companion for session-lifecycle correctness checks.

## 中文简介

`@deepseek-ai/dsh-win-desktop` 是 DeepSeek Harness（DSH）的 Windows 桌面插件，通过本地 HTTP 服务桥接 Windows 桌面会话。它在 8765 端口（可配置）运行一个轻量 HTTP 服务器，提供完整的会话管理 REST API（`GET /health`、`GET /sessions`、`POST /sessions`、`DELETE /sessions/:id`），并以 React 组件形式注入 DSH Web UI 的 Slot 系统，支持 3 秒轮询刷新和实时状态指示。该插件严格遵循 DSH 官方插件架构：Host 端基于 Cordis `Service` 类实现，使用 `schemastery` 做配置校验，注册 `winDesktop:session:start` 和 `winDesktop:session:stop` 生命周期事件，并附带不变量检查确保会话 CRUD 与事件发射的一致性；Client 端通过 `ctx.slots.inject()` 将 `WinDesktopPanel` 注册到 `win-desktop.panel` 槽位，使用 `ctx.locale.register()` 挂载中英双语字典。插件预构建 ESM 产物在 `lib/` 目录，用户仅需 Node.js >= 22 即可零依赖安装——通过 `bin/dsh-win-desktop.bat install` 自动复制 bundle 并写入 `DSH_HOME/plugins/` 及 `profiles/web/cordis.patch.yml`，无需 pnpm、TypeScript 工具链或 dsh CLI。采用 MIT 许可证，端口默认绑定 127.0.0.1 仅限本地访问，无持久化存储、无外部网络请求，安全性由设计保证。

## Features

- **Zero-dependency install** — only Node.js >= 22 required
- **HTTP session bridge** — REST API for desktop session management
- **React UI panel** — injected into DSH via slot system with 3s polling
- **Bilingual** — English / 中文 locale dictionaries
- **Cordis-invariant safe** — session lifecycle correctness checks
- **Auto-patch injection** — writes to `profiles/web/cordis.patch.yml` on install

## Quick Start

```bash
# Zero-dependency install (Node.js >= 22 required)
git clone https://github.com/deepseek-ai/deepseek-harness-win-desktop.git
cd deepseek-harness-win-desktop
node bin/dsh-win-desktop.bat install
node bin/dsh-win-desktop.bat start

# Verify
node bin/dsh-win-desktop.bat status
curl http://localhost:8765/health
```

## Commands

```
node bin/dsh-win-desktop.bat install   # Install bundle to DSH_HOME/plugins/
node bin/dsh-win-desktop.bat start     # Start bridge (port 8765)
node bin/dsh-win-desktop.bat status    # Show service status
node bin/dsh-win-desktop.bat stop      # Stop bridge
node bin/dsh-win-desktop.bat doctor    # Environment diagnostic
```

## API

| Method | Path | Response |
|--------|------|----------|
| GET | `/health` | `{status:ok,version:0.1.0,sessions:N,port:8765}` |
| GET | `/sessions` | `[{id,name,status,startedAt},...]` |
| POST | `/sessions` | 201 `{id,name,status:running,startedAt:ts}` |
| DELETE | `/sessions/:id` | 204 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DSH Web Client                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              WinDesktopPanel (React)                   │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐         │  │
│  │  │ Session 1 │  │ Session 2 │  │  + New    │         │  │
│  │  │ [Running] │  │ [Stopped] │  │  Button   │         │  │
│  │  └───────────┘  └───────────┘  └───────────┘         │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │ ctx.slots.inject()              │
└────────────────────────────┼───────────────────────────────┘
                             │ HTTP 127.0.0.1:8765
┌────────────────────────────┼───────────────────────────────┐
│                    Host Service                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           WinDesktopService (Cordis Service)          │  │
│  │  • GET  /health    → status + session count           │  │
│  │  • GET  /sessions  → list all sessions                 │  │
│  │  • POST /sessions  → create new session (201)         │  │
│  │  • DEL  /sessions/:id → delete session (204)          │  │
│  │  • Lifecycle: winDesktop:session:start/stop           │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Invariant Checks (cjs/invariant)              │  │
│  │  • session.start() → emit start event                │  │
│  │  • session.stop()  → validate started → emit stop    │  │
│  │  • session.delete()→ validate exists                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
deepseek-harness-win-desktop/
├── src/
│   ├── host/
│   │   ├── index.ts          # WinDesktopService + HTTP routes
│   │   └── invariant.ts      # Session lifecycle checks
│   └── client/
│       ├── app.tsx           # React entry point
│       ├── ui-panel.tsx      # WinDesktopPanel component
│       ├── slots.ts          # SlotMap declaration
│       └── locales.ts        # en/zh dictionaries
├── lib/                      # Pre-built ESM artifacts
│   ├── index.js
│   ├── invariant.js
│   └── client.js
├── bin/
│   └── dsh-win-desktop.bat   # Zero-dep launcher
├── scripts/
│   └── standalone-dsh.cjs    # CLI implementation
├── .github/
│   ├── workflows/ci.yml
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── cordis.patch.yml          # Patch template
├── dsh-plugin.json
└── README.md
```

## Development

```bash
# Requires pnpm + Node.js >= 22
pnpm install
pnpm build        # Compiles src/ → lib/
pnpm dev          # Watch mode
pnpm test         # Run tests
```

## Environment

| Dependency | Min Version | Zero-dep Mode |
|-----------|-------------|---------------|
| Node.js   | 22.0.0      | Required      |
| pnpm      | 9.0.0       | Optional (dev)|
| TypeScript| 5.4.0       | Pre-built     |

## Security

- **Loopback only**: Server binds to `127.0.0.1` — not accessible from network
- **No persistence**: Sessions are ephemeral in-memory maps
- **No external calls**: Zero outbound network requests
- **No auth required**: Local-only scope makes auth unnecessary

## License

MIT — see [`LICENSE`](LICENSE) for details.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Support

- 🐛 Bug reports: [GitHub Issues](https://github.com/deepseek-ai/deepseek-harness-win-desktop/issues)
- 💡 Feature requests: [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness-win-desktop/discussions)
- 📖 Official DSH: [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
