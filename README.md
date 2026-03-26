# 🎨 unDraw Multi-Ecosystem Suite

Unified, high-performance CLI and developer tools for [unDraw](https://undraw.co) illustrations, shipping with 1:1 parity across **Rust**, **JavaScript**, and **Python**.

---

## 🚀 Triple-Core Architecture
This project is built using the [OSS Multi-Registry Shell](https://github.com/stefdevscore/oss-template), ensuring maximum performance and zero-dependency distribution.

- **`core-rs`**: The high-performance Rust engine (Crates.io: `undraw-rs`).
- **`wrapper-js`**: Zero-dependency binary wrapper (NPM: `undraw-cli`).
- **`wrapper-py`**: Zero-dependency CLI wrapper (PyPI: `undraw-py`).
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
Licensed under the [MIT License](LICENSE). 
Built with ❤️ for the Multi-Ecosystem developer.
