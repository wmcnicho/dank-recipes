# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal meal-prep app replacing a long-running Google Sheets workflow: browse a recipe collection visually, pick 3–5 recipes for the week, shop, cook. The source of truth is the Google Sheet ("Dank Recipes"); `Dank Recipes - All Recipes.csv` at the repo root is a CSV snapshot of it.

## Commands

Node is installed at `~/.local/node` and is NOT on PATH — prefix commands with
`export PATH="$HOME/.local/node/bin:$PATH"`. All app commands run from `dank_recipes_site/`:

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — production build
- `npm run lint` — ESLint
- No tests exist.

Deploy: `./deploy.sh` at the repo root builds and force-pushes `dist/` to the `gh-pages`
branch of https://github.com/wmcnicho/dank-recipes, serving https://wmcnicho.github.io/dank-recipes/.
GitHub Actions is not used — the `gh` OAuth token lacks the `workflow` scope
(run `gh auth refresh -s workflow` if CI deploys are ever wanted). The `gh` CLI lives at `~/.local/gh/bin`.

Refresh recipe data (from `dank_recipes_site/`, after updating the root CSV):

```
python3 build_data.py     # CSV + scrape cache -> src/recipes.json
python3 fetch_images.py   # fetch og:image/title for entries missing images
python3 build_data.py     # fold new scrapes in
```

## Architecture

Two halves: a Python data pipeline and a Vite + React 18 app. No backend — recipe data is baked into the bundle.

**Data pipeline** (`dank_recipes_site/`):
- `build_data.py` — parses the root CSV, dedupes by URL, derives titles for URL-only rows (scraped page title, else URL slug), classifies each recipe into a protein lane (`fish` / `chicken` / `red meat` / `veg` / `sweets`) via keyword rules + hand overrides, merges images from the scrape cache, writes `src/recipes.json`.
- `fetch_images.py` — plain-HTTP og:image/og:title fetch for recipes missing images; appends to the scrape cache `recipes_with_metadata.json`.
- `convert.py` / `extract_meta.py` / `retry_extract.py` — the original Playwright pipeline, superseded by the above; kept for reference.

**App** (`src/App.jsx`, styles in `App.css`): built around the weekly picking flow — a sticky "This Week" tray with four protein lanes (the household's weekly structure: 1 fish, 1 red meat, 1 chicken, 1 veg), protein filter chips, search, and a card grid. Clicking a card toggles it into its lane; clicking a lane filters the grid to that protein.

**Week sync** (`src/sync.js`, backend in `apps_script/Code.gs`): the sheet's "Current Recipes" tab is the shared source of truth for the week. A Google Apps Script web app (deployed manually from the sheet — see comments in `Code.gs`; updates need Manage deployments → New version to keep the URL) serves GET `{week, recipes}` (week tab + All Recipes tab) and POST actions `setWeek`, `addRecipe` (append to All Recipes, dedupe by url), `markCooked` (stamp Date Cooked col E + append to a "Cook Log" tab) — all shared-secret gated. The app loads state on mount, saves week changes debounced 800ms, and skips echo saves. Sheet week rows that don't match any recipe are preserved on save and shown as "also on the sheet". All Recipes rows missing from the baked JSON become "dynamic" recipes (id `sheet:<url>`, placeholder image, protein classified from title by the same rules as build_data.py) — rerunning the CSV pipeline later enriches them. If GET lacks `recipes` (v1 backend still deployed), the app shows an update banner and hides cook/add. POSTs use `Content-Type: text/plain` because Apps Script can't answer CORS preflight. The endpoint URL lives in `src/config.js` (`SYNC_URL`), overridable per-browser via localStorage key `syncUrl`; empty URL = localStorage-only mode (`weekPicks` key, recipe ids).

**CSA page** (`src/Csa.jsx` + `Csa.css`, data in `src/pairings.js`, route `#/csa` via the hash Router in `main.jsx` — GitHub Pages can't serve real sub-paths): prototype "box puzzle" for the weekly CSA share. Paste the CSA email → `parseBox` extracts ingredients (alias table normalizes CSA spellings, e.g. "lacinato kale" → kale; unmatched short food-looking lines are kept with a `?`); tap an ingredient → flavor-pairing suggestions (curated original dataset, Flavor-Bible-inspired) + title-matched recipes from the collection; ingredients/pairings accumulate into "idea" cards (title + chips + notes). Shopping list = idea items not in the box. State is localStorage-only (`csaState`), no sheet sync yet.

**PWA** (`public/manifest.webmanifest`, `public/sw.js`, icons in `public/icons/` — generated, cream bg + fire emoji, opaque/unrounded per iOS rules): installable via Share → Add to Home Screen. All PWA paths account for the `/dank-recipes/` Pages subpath (`scope`/`start_url`/`id` hardcode it; icon and SW paths are relative / `import.meta.env.BASE_URL`). The SW pre-caches the shell and hashed assets at install (parsed from index.html), serves navigations network-first, assets stale-while-revalidate, and skips cross-origin (recipe images, Apps Script). Registered in `main.jsx`, production builds only. GitHub Pages serves everything with `cache-control: max-age=600`; SW update checks bypass the HTTP cache, so deploys land within ~10 min.

## Data notes

- CSV columns: `Title, Link, Maddy Rating, Hunter Rating, Date Cooked, Notes` (ratings 1–5, dates M/D/YYYY). Newer rows (~row 118+) are URL-only with no title. Two rows are notes-to-self, filtered out by `build_data.py`.
- A few `Link` cells are pasted link text, not URLs (e.g. "… - Cookie and Kate"); these keep `url: null` / `linkText` in the JSON and get a placeholder card.
- Recipe `id`s are CSV row order, so they shift if rows are inserted mid-sheet — `weekPicks` in localStorage may point at the wrong recipes after a data refresh.
- Ratings are sparse (mostly Maddy's, from 2020–2022); the couple stopped rating but may want the feature revisited in-app later.
