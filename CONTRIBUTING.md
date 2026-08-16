# Contributing to @deepseek-ai/dsh-win-desktop

Thanks for your interest in contributing! This document covers the development workflow.

## Prerequisites

- Node.js >= 22.19
- pnpm >= 9 (for development; not needed for zero-dep usage)

## Getting Started

```bash
# Clone and install
git clone https://github.com/deepseek-ai/deepseek-harness-win-desktop.git
cd deepseek-harness-win-desktop
pnpm install

# Type check
pnpm typecheck

# Build
pnpm build

# Test
pnpm test
```

## Development Workflow

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes to `src/` (TypeScript source)
3. Run `pnpm build` to regenerate `lib/`
4. Verify zero-dep install: `node bin/dsh-win-desktop.bat install`
5. Test HTTP endpoints: `curl http://localhost:8765/health`
6. Run full verify: `pnpm verify`
7. Commit with conventional commits: `feat: add session filtering`
8. Push and open a PR

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add session search endpoint
fix: handle malformed session IDs
docs: update README installation section
chore: update dependencies
```

## Pull Request Checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
- [ ] Zero-dependency install works
- [ ] HTTP API endpoints tested
- [ ] Documentation updated
- [ ] No breaking changes without migration notes

## Zero-Dependency Release

When releasing, ensure `lib/` contains pre-built ESM artifacts:

```bash
pnpm build
# Verify lib/index.js is ESM (uses import/export, not require)
head -5 lib/index.js
```

The `bin/dsh-win-desktop.bat` and `scripts/standalone-dsh.cjs` must work with Node.js >= 22 only.