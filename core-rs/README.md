# unDraw CLI (Rust) 🦀

> A high-performance, single-binary Rust CLI to search, customize, and download the entire [unDraw](https://undraw.co) library (1,650+ illustrations).

This is the Rust port of the original [undraw-cli](https://github.com/stefdevscore/undraw-cli).

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
cargo install undraw
```

### Usage

1. **List or Search illustrations**:
   ```bash
   undraw list           # Browse by page (20 per page)
   undraw list "space"   # Search for "space"
   undraw list --page 2  # Go to page 2
   ```

2. **Download with a custom color**:
   ```bash
   undraw download astronomy_ied1 --color #34d399
   ```

3. **Sync the library**:
   ```bash
   undraw sync
   ```

---

## 🙏 Credits & Attribution

### unDraw Illustrations
The illustrations are provided by **Katerina Limpitsouni** at [unDraw.co](https://undraw.co).  

*Note: This is an unofficial community project and is not affiliated with unDraw.co.*

---

## ⚖️ License
MIT
