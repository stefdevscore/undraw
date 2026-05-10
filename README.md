# 🎨 unDraw Multi-Ecosystem Suite

Unified, high-performance CLI and developer tools for [unDraw](https://undraw.co) illustrations, shipping with 1:1 parity across **Rust**, **JavaScript**, and **Python**.

---

- **Rust**: High-performance binary for speed and efficiency.
- **JavaScript**: Quick, zero-dependency tool for web developers.
- **Python**: Minimalist script for data and AI workflows.
- **AI Skill**: Ready-to-use intelligence for AI assistants (Skills.sh).

## 🛠️ Usage

### Rust
```bash
cargo install undraw-rs
undraw-rs list
```

### JavaScript (NPM)
```bash
npm i -g undraw-cli
npx undraw-cli list "astronomy"
npx undraw-cli list "astronomy" --json
npx undraw-cli download astronomy_ied1 --json --out ./assets
```

### Python (PyPI)
```bash
pip install undraw-py
undraw download astronomy
undraw list "astronomy" --json
```

### Machine-readable discovery
All CLIs support JSON output for agent and script workflows:

```bash
undraw list "dashboard" --json
undraw download dashboard_re_3_0 --json --out ./assets
```

`list --json` includes `schema_version`, `query`, `page`, `per_page`, `total`, `total_pages`, and `items` with stable `id`, `title`, and exact upstream `svg_url` fields.

`download --json` writes the SVG and returns a manifest with `schema_version`, `id`, `title`, `svg_url`, `path`, `color`, and `bytes`.

### Agent contract diagnostics
Before release or after upstream drift, replay the live contract:

```bash
node scripts/agent-contract-check.mjs
node scripts/agent-contract-check.mjs --human
```

The diagnostic compares live unDraw data with all embedded inventories, validates sampled `svg_url` reachability, and runs local CLI checks when builds are available.

## 🔐 Security & Distribution
- **OIDC/Trusted Publishing**: Secure, tokenless distribution via GitHub Actions.
- **SLSA Provenance**: Verifiable build chain for the NPM package.

## ⚖️ License
Licensed under the [Unlicense](LICENSE). 
Dedicated to the Public Domain.
