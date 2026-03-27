# Roadmap: unDraw CLI Future

Below is a non-exhaustive list of planned features and research directions for the `undraw-cli`. If you'd like to contribute, please check out the [CONTRIBUTING.md](../CONTRIBUTING.md) guide.

## 🚀 Planned Features

### 1. Interactive TUI Explorer
- A terminal-based "gallery" view (likely using `clui` or `inquirer-fuzzy-path`-style filtering).
- Purpose: Browse 1,650+ items interactively with arrow keys and live search.

### 2. Full Asset Mirroring (`undraw mirror`)
- High-speed download of the entire unDraw library to a local directory.
- Purpose: Enable 100% offline agentic AI development where latency or network access is a constraint.

### 3. ANSI/ASCII Previews
- Low-fidelity terminal previews for illustrations before downloading.
- Purpose: Help users confirm they have the right "vibe" without opening a browser or file explorer.

### 4. Template Integration
- Automatic wrapping of downloaded SVGs into React/Vue/Svelte components.
- Purpose: Speed up frontend development workflows.

## 📡 Research Directions
- **Vector Transformation**: Automated SVG optimization during download.
- **Bulk Customization**: Applying color palettes (multiple colors) to illustrations by detecting secondary unDraw colors.

---

*Open an [Issue](https://github.com/stefdevscore/undraw/issues) to suggest new ideas!*
