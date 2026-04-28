# HHS Cyber Gateway

Static site for HHS Cyber Gateway, built with Parcel, Pug templates, SCSS, and committed JSON content snapshots.

## Stack

- Node.js (LTS recommended)
- pnpm
- Parcel 2
- Pug + SCSS

## Getting Started

1. Install dependencies:
   - `pnpm install`
2. Start local dev server:
   - `pnpm start`
3. Build production output:
   - `pnpm build`

## Commands

- `pnpm start`  
  Runs Parcel in dev mode and writes output to `dev-dist/`.
- `pnpm build`  
  Runs `prebuild`, then creates a production build in `dist/`.
- `pnpm run clean`  
  Removes `dist/` and `.parcel-cache/`.
- `pnpm run fetch-content`  
  Refreshes live content snapshots in `src/data/` from the API.

## Content and Data Workflow

- Content used at build time is stored as committed JSON snapshots in `src/data/`.
- `scripts/fetch-content.mjs` pulls live resource/post/notice data and atomically rewrites snapshot files.
- `scripts/build-search-index.mjs` generates `src/data/search-index.json` from committed resource snapshots.
- `pnpm build` automatically runs search index generation via `prebuild`.

## Project Structure (High Level)

- `src/` - Pug pages, includes, styles, scripts, and data
- `scripts/` - Utility scripts for fetching content and building the search index
- `pug.config.js` - Shared template locals and content transformations

## Agent and Developer Notes

- Read this README before making structural changes.
- Keep temporary planning notes in `.scratch/` (or `scratch/`) so they remain untracked.
- Do not commit local tooling state (`.cursor/`, `.claude/`, etc.) or OS/editor artifacts.
- Build before delivery: `pnpm build`.

## Delivery Checklist

- `pnpm install`
- `pnpm build`
- Verify only intended files are staged in `git status`
- Confirm transient planning files are untracked (`.scratch/`, `*.local.md`, etc.)

## License

`package.json` currently lists `ISC`. Confirm client ownership and licensing expectations before publishing a LICENSE file.
