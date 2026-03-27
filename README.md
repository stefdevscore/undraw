# 🎨 unDraw Multi-Ecosystem Suite

Unified, high-performance CLI and developer tools for [unDraw](https://undraw.co) illustrations, shipping with 1:1 parity across **Rust**, **JavaScript**, and **Python**.

---

This suite follows the **Triple-Native Core** pattern: three independent, native implementations (Rust, JS, and Python) perfectly synchronized for 1:1 feature parity. This ensures **zero binary-fetching overhead** and produces ultra-lightweight packages (<50KB for JS/PY).

- **`core-rs`**: Native high-performance Rust core (Crates.io: `undraw-rs`).
- **`core-js`**: Native Node.js implementation (NPM: `undraw-cli`).
- **`core-py`**: Native Python implementation (PyPI: `undraw-py`).
- **`skill`**: Agent-ready skill for AI assistants (Skills.sh).

## 🛠️ Usage

### Rust
```bash
cargo install undraw-rs
undraw list
```

### JavaScript (NPM)
```bash
npx undraw-cli search "astronomy" --color #ff0077
```

### Python (PyPI)
```bash
pip install undraw-py
undraw download astronomy
```

## 🔐 Security & Distribution
- **OIDC/Trusted Publishing**: Secure, tokenless distribution via GitHub Actions.
- **SLSA Provenance**: Verifiable build chain for the NPM package.

## ⚖️ License
Licensed under the [Unlicense](LICENSE). 
Dedicated to the Public Domain.
