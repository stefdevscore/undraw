---
name: undraw-cli-skill
description: Comprehensive knowledge for managing unDraw illustrations via CLI (JS/PY/RS).
---

## SCOPE
- **Search**: Keyword-based illustration discovery.
- **Customization**: Injecting brand hex codes into unDraw SVGs.
- **Library Sync**: Keeping local metadata in sync with unDraw.co.
- **Multi-Ecosystem**: Usage instructions for `undraw` (Rust), `undraw-py` (Python), and `undraw-cli` (JS).

## TOOLS & COMMANDS
### 1. Search & List
- `undraw list` (RS) / `undraw list` (PY): Browse the library (20/page).
- `undraw list <query>` (RS/PY): Find illustrations by keyword.

### 2. Download & Customize
- `undraw download <id> --color <hex>`: Fetch SVG and replace `#6c63ff` with `<hex>`.
- Default color: `#6c63ff` (classic unDraw purple).

### 3. Maintenance
- `undraw sync`: Crawls unDraw.co to update the local embedded inventory. Rebuild may be required for compiled versions (RS).

## BEST PRACTICES
- **Naming**: Use the `newSlug` (e.g., `astronomy_ied1`) for unique identification.
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
