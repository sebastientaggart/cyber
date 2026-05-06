# HHS Cyber Gateway

Static site for HHS Cyber Gateway, built with Parcel, Pug templates, SCSS, and committed JSON content snapshots.

## Stack

- Node.js (LTS recommended)
- pnpm
- Parcel 2
- Pug + SCSS

## Getting Started

Node 24 is required (see `.nvmrc`). On Windows, install via [nvm-windows](https://github.com/coreybutler/nvm-windows) or download from nodejs.org. pnpm only warns on engine mismatch — it will not block install on the wrong version.

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
- `pnpm run copy-static`  
  Copies `src/Documents`, `src/threats`, and `src/video` into `dev-dist/` (run once after `pnpm start` if you need local PDF/video URLs).
- `pnpm run transcode-video`  
  Re-encodes MP4s under `src/threats/` and `src/video/` for web delivery (see `scripts/transcode-web-mp4.mjs`). Requires `ffmpeg` on `PATH`.
- `pnpm run optimize-pdf`  
  Runs `scripts/optimize-web-pdf.mjs` — pass one or more PDF paths; optional `--qpdf-only` for 508-sensitive files. Requires `qpdf` and `gs` unless `--qpdf-only`.
- `pnpm run optimize-pdf-documents`  
  Runs the same pipeline on **all** PDFs under `src/Documents/` recursively (`--dir src/Documents --quiet`). Skips files that are not real PDFs (e.g. HTML placeholder bodies with a `.pdf` extension).

## Content and Data Workflow

- Content used at build time is stored as committed JSON snapshots in `src/data/`.
- `scripts/fetch-content.mjs` pulls live resource/post/notice data and atomically rewrites snapshot files.
- `scripts/build-search-index.mjs` generates `src/data/search-index.json` from committed resource snapshots.
- `pnpm build` automatically runs search index generation via `prebuild`, then copies `src/Documents`, `src/threats`, and `src/video` into `dist/` (stable paths, not content-hashed).
- Large PDFs and videos live under `src/Documents/`, `src/threats/`, and `src/video/` (committed in git). Pug locals `documentsBase`, `threatsMediaBase`, and `videoMediaBase` in `pug.config.js` use the production `https://hhscyber.hhs.gov` origin so Parcel does not treat root-relative `/Documents/...` strings in data as bundle dependencies.
- KOD **CPR** chapter videos still load from `https://405d.hhs.gov/video/...` in `page-contents.json` when the legacy host returns HTML stubs instead of MP4s for automated download.

## Project Structure (High Level)

- `src/` - Pug pages, includes, styles, scripts, and data
- `scripts/` - Fetch content, search index, static asset copy, video transcode, PDF optimize
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
