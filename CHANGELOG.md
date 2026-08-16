# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-08-16

### Added
- Zero-dependency installer via `bin/dsh-win-desktop.bat`
- `WinDesktopService` with HTTP CRUD endpoints
- React UI panel injected via DSH slot system
- Bilingual support (English / 中文)
- Session lifecycle invariant checks
- Auto patch injection into DSH profile
- CI/CD workflow (GitHub Actions)
- `doctor` command for environment diagnostics

### Changed
- Pre-built `lib/` artifacts ship as ESM (compatible with `"type": "module"`)
- Default port changed from 3080 to 8765

### Fixed
- Path nesting bug in `cmdInstall` (was creating `lib/lib/` instead of `lib/`)

## [Unreleased]

### TODO
- [ ] Add SQLite session persistence
- [ ] Add auth token for HTTP API
- [ ] Support WebUI proxy mode
- [ ] Add GUI window wrapper (Electron/Tauri)