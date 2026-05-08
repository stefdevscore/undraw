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
undraw list
```

### JavaScript (NPM)
```bash
npx undraw-cli list "astronomy"
npx undraw-cli list "astronomy" --json
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
```

The response includes `query`, `page`, `per_page`, `total`, `total_pages`, and `items` with stable `id` and `title` fields.

## 🔐 Security & Distribution
- **OIDC/Trusted Publishing**: Secure, tokenless distribution via GitHub Actions.
- **SLSA Provenance**: Verifiable build chain for the NPM package.

## ⚖️ License
Licensed under the [Unlicense](LICENSE). 
Dedicated to the Public Domain.
