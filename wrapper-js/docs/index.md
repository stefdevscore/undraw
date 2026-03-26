# unDraw CLI Documentation

## 1. Overview

This CLI allows you to search, customize, and download illustrations from [unDraw](https://undraw.co) directly from your terminal.

## 2. Key Features

- **Search**: Find illustrations by title or keyword.
- **Customize**: Change the primary color of any illustration on-the-fly.
- **Export**: Download SVGs to a specific location for use in your projects.

## 3. Technical Strategy

### Illustration Discovery

We use the unDraw internal Next.js data feed to fetch the latest list of illustrations. This requires discovering the current `buildId` from the unDraw homepage.

### Color Customization

unDraw SVGs use a default primary color of `#6c63ff`. The CLI performs a string replacement on the fetched SVG source before saving it locally.

### Registry

- Illustrations are fetched from: `https://cdn.undraw.co/illustration/{id}.svg`
- Metadata is fetched from: `https://undraw.co/_next/data/{buildId}/illustrations.json`
