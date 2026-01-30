<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Banodoco 1M Wrapped

Animated data visualization celebrating the Banodoco Discord community reaching 1 million messages.

## Features

- Scroll-driven animations powered by Framer Motion
- Interactive model trend timeline with play/pause
- Top generations gallery with lightbox
- Activity heatmap, hall of fame, and fun stats
- Fully responsive dark theme

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS (via CDN)
- Recharts
- Framer Motion
- Lucide React

## Getting Started

```sh
npm install
npm run dev
```

No API keys or environment variables needed. Data is pre-computed in `public/data.json`.

## Data Regeneration (optional)

```sh
npm run precompute
```

Requires Supabase access to the Discord message archive. Outputs a fresh `public/data.json`.

## Build & Deploy

```sh
npm run build
```

Static site — deploy the `dist/` folder anywhere (Vercel, Netlify, GitHub Pages, etc.).

## Project Structure

```
App.tsx                  # Root app component
components/              # All UI sections (Hero, Heatmap, ModelTrends, …)
public/data.json         # Pre-computed dataset
scripts/precompute.ts    # Data generation script
types.ts                 # Shared TypeScript types
useDiscordData.ts        # Data-loading hook
```
