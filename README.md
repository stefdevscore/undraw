# 🎨 unDraw Multi-Ecosystem Suite

Unified, high-performance CLI and developer tools for [unDraw](https://undraw.co) illustrations, shipping with 1:1 parity across **Rust**, **JavaScript**, and **Python**.

---

This suite follows the **Triple-Native Parity** pattern: three independent, native implementations (Rust, JS, and Python) synchronized to provide identical behavior across all registries with zero binary-fetching overhead.

- **`core-rs`**: Native high-performance Rust engine (Crates.io: `undraw-rs`).
- **`wrapper-js`**: Native zero-dependency Node.js CLI (NPM: `undraw-cli`).
- **`wrapper-py`**: Native zero-dependency Python CLI (PyPI: `undraw-py`).
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
