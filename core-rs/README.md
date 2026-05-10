# unDraw CLI (Rust) 🦀

> A high-performance, single-binary Rust CLI to search, customize, and download the entire [unDraw](https://undraw.co) library (1,650+ illustrations).

The high-performance core of the unDraw suite.

---

## ✨ Features

- **🚀 Native Performance**: Blazing fast search and decompression.
- **📦 Single Binary**: Zero runtime dependencies—just a single executable.
- **🎨 On-the-Fly Customization**: Automatically replace the default unDraw color with your brand's hex code.
- **🎯 Tiny Footprint**: Compiled with size optimizations for minimal disk usage.

---

## 🚀 Quick Start

### Installation

```bash
cargo install undraw-rs
```

### Usage

1. **List or Search illustrations**:
   ```bash
   undraw-rs list           # Browse by page (20 per page)
   undraw-rs list "space"   # Search for "space"
   undraw-rs list --page 2  # Go to page 2
   undraw-rs list "space" --json  # Machine-readable results
   ```

2. **Download with a custom color or JSON manifest**:
   ```bash
   undraw-rs download astronomy_ied1 --color #34d399
   undraw-rs download astronomy_ied1 --json --out ./assets
   ```

3. **Sync the library**:
   ```bash
   undraw-rs sync
   ```

`list --json` responses include `schema_version`, pagination fields, and `items[].id`, `items[].title`, and `items[].svg_url`.

`download --json` writes the SVG and emits a manifest with `schema_version`, `id`, `title`, `svg_url`, `path`, `color`, and `bytes`.

---

## 🙏 Credits & Attribution

### unDraw Illustrations
The illustrations are provided by **Katerina Limpitsouni** at [unDraw.co](https://undraw.co).  

*Note: This is an unofficial community project and is not affiliated with unDraw.co.*

---

## ⚖️ License
Unlicense
