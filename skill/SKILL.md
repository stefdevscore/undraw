---
name: undraw-cli-skill
description: Comprehensive knowledge for managing unDraw illustrations via CLI (JS/PY/RS).
---

## SCOPE
- **Search**: Keyword-based illustration discovery.
- **Customization**: Injecting brand hex codes into unDraw SVGs.
- **Library Sync**: Keeping local metadata in sync with unDraw.co.
- **Multi-Ecosystem**: Usage instructions for `undraw-rs` (Rust), `undraw-py` (Python), and `undraw-cli` (JS).

## TOOLS & COMMANDS
### 1. Search & List
- `undraw-rs list` (RS) / `undraw list` (JS/PY): Browse the library (20/page).
- `undraw-rs list <query>` (RS) / `undraw list <query>` (JS/PY): Find illustrations by keyword.
- `undraw list <query> --json`: Return stable machine-readable discovery results with `schema_version`, `query`, `page`, `per_page`, `total`, `total_pages`, and `items` (`id`, `title`, `svg_url`).

### 2. Download & Customize
- `undraw download <id> --color <hex>`: Fetch SVG and replace `#6c63ff` with `<hex>`.
- `undraw download <id> --json --out <dir>`: Write the SVG and return a manifest with `schema_version`, `id`, `title`, `svg_url`, `path`, `color`, and `bytes`.
- Default color: `#6c63ff` (classic unDraw purple).

### 3. Maintenance
- `undraw sync`: Crawls unDraw.co to update the local embedded inventory. Rebuild may be required for compiled versions (RS).

## BEST PRACTICES
- **Naming**: Use `items[].id` (the unDraw `newSlug`, e.g., `astronomy_ied1`) for unique identification.
- **Agent workflows**: Prefer `undraw list <query> --json` when selecting assets programmatically, then pass `items[].svg_url` through the CLI by downloading that exact `id`.
- **Verification**: Run `node scripts/agent-contract-check.mjs --human` in this repo before release checks when source access is available.
- **Batching**: For large-scale downloads, use a loop with the CLI rather than manual UI clicks.
- **Consistency**: Always pass the same brand hex code across a project for visual cohesion.

## CASE STUDIES
### Task: "Need a green dashboard illustration"
1. Run `undraw list dashboard` to find relevant IDs.
2. Select ID (e.g., `dashboard_re_3_0`).
3. Run `undraw download dashboard_re_3_0 --color #34d399`.

## LIMITATIONS
- Requires an active internet connection for downloads (inventory is local).
- unDraw.co rate limiting might occur if syncing too aggressively.
