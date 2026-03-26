# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-03-26

### Optimized
- **Aggressive Refactor**: Slashed core logic from 180 to **64 lines of code**.
- **Zero-Dependency Networking**: Migrated to native Node 20 `fetch`, removing the `node-fetch` dependency.
- **Consolidated CLI**: Merged `search` and `list` into a single, high-efficiency command.

## [0.3.0] - 2026-03-26

### Fixed

- Cleaned up repository by removing accidentally tracked `node_modules` and `dist` directories.

## [0.1.0] - 2026-03-26

### Added

- Initial release of the `undraw-cli`.
- `sync` command to crawl the full unDraw library (1,650+ items).
- `list` command with paginated library exploration.
- `search` command for keyword-based illustration discovery.
- `download` command with automated color customization (`#6c63ff` replacement).
- MIT License and comprehensive community documentation.
- Husky-powered quality gates and GitHub Actions CI.
