# unDraw CLI Skill 🎨

> Comprehensive knowledge for managing unDraw illustrations via CLI (JS, Python, and Rust).

This skill provides an AI agent with the instructions and best practices required to search, customize, and download unDraw illustrations directly into a codebase.

---

## 🚀 Usage

### ⚙️ Prerequisite: Install the CLI
Ensure you have either the **Rust** or **Python** version installed:

```bash
# Rust (Recommended)
cargo install undraw-rs

# Python
pip install undraw-py
```

### 🔍 Search & Discovery
Find the perfect illustration by searching for descriptive keywords:

```bash
undraw list "space"
undraw list "space" --json
```

JSON discovery includes `schema_version` plus `items[].id`, `items[].title`, and the exact `items[].svg_url` used for download resolution.

### 🎨 Customization
Download illustrations while replacing the default unDraw purple (`#6c63ff`) with your own brand color:

```bash
undraw download astronomy_ied1 --color #34d399
undraw download astronomy_ied1 --json --out ./assets
```

`download --json` writes the SVG and returns `schema_version`, `id`, `title`, `svg_url`, `path`, `color`, and `bytes`.

---

## 🛠️ Components

- **[SKILL.md](SKILL.md)**: Core instruction set for the AI agent.
- **Support**: Works with `undraw-rs` (Rust), `undraw-py` (Python), and `undraw-cli` (JavaScript).

---

## 🙏 Credits

Illustrations by **Katerina Limpitsouni** at [unDraw.co](https://undraw.co).  
Original CLI idea by **stefdevscore**.

---

## ⚖️ License
Unlicense
