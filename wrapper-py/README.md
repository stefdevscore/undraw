# unDraw CLI (Python) 🎭

> A high-performance, ultra-minimalist Python CLI to search, customize, and download the entire [unDraw](https://undraw.co) library (1,650+ illustrations).

This is the Python port of the original [undraw-cli](https://github.com/stefdevscore/undraw-cli).

---

## ✨ Features

- **🎯 Zero-Dependency Networking**: Built with native `urllib.request`—no external network libraries.
- **🚀 Consolidated Search**: Search 1,650+ illustrations by keyword or browse by page.
- **🎨 On-the-Fly Customization**: Automatically replace the default unDraw color with your brand's hex code.
- **📦 Ultra-Tiny footprint**: Modern Python packaging with `hatchling`.
- **🤖 Agentic Ready**: Optimized for AI developers who need structured, fast access to high-quality SVG assets.

---

## 🚀 Quick Start

### Installation

```bash
pip install undraw-py
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

## 🛠️ Commands

- `undraw list [query]`: Paginated browsing or keyword search.
- `undraw download <id>`: Fetch the SVG and apply a custom hex color.
- `undraw sync`: Crawls unDraw.co and updates the embedded source metadata.

---

## 🙏 Credits & Attribution

### unDraw Illustrations
The illustrations are provided by **Katerina Limpitsouni** at [unDraw.co](https://undraw.co).  

*Note: This is an unofficial community project and is not affiliated with unDraw.co.*

---

## ⚖️ License
MIT
