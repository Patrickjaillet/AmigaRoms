# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Repository structure: `/scripts` (indexer), `/src` (frontend types/config/utils), `/data` (generated JSON), `/public`.
- Strict TypeScript configuration (`tsconfig.base.json`) shared by the indexer and frontend projects.
- ESLint (strict-type-checked) and Prettier configuration.
- Archive.org API types and zod schemas (`src/types/archive-org.ts`).
- Internal canonical schema: `RomEntry`, `PlatformCatalog`, `SearchIndexManifest` (`src/types/rom.ts`).
- Platform configuration and mapping to Archive.org collections (`src/config/platforms.config.ts`).
- Indexer pipeline: discovery, metadata extraction, transformation, and validated JSON output (`scripts/`).
- HTTP client with retry/backoff, concurrency limiter, and `Result<T, E>` error handling utilities.
- Unit test suite covering schemas, transformation, discovery, metadata, output, and CLI parsing.
- Project documentation: `ARCHITECTURE.md`, `ROADMAP.md`, `COMPILATION.md`, `README.md`.
- Dedicated `tests/tsconfig.json` type-checking project, wired into the root project references and `npm run typecheck`.
- `.github/workflows/deploy.yml`: deploys `/public` to GitHub Pages on every push to `main`.
- Placeholder landing page (`public/index.html`) with project name and footer attribution, served until the Phase 4 frontend replaces it.
- `.github/workflows/index.yml`: weekly scheduled (and manually dispatchable) run of the indexer, committing `/data/*.json` back to `main` only when the output changed.
- `.github/workflows/ci.yml`: runs typecheck, lint, and the test suite on every push to `main` and every pull request.
- Documented CI/CD workflows and their required (none) secrets and optional configuration variables in `COMPILATION.md`.
- Svelte 5 + Vite frontend scaffold under `src/app/`: app-level types (`AppState`, `SearchFilters`, `SortOption`, `LoadingState`), typed data loaders for platform catalogs and the manifest, a `debounce` utility, and a `vite.config.ts` dev middleware serving `/data/*.json` at the same path the production build uses.
- MiniSearch integration (`src/app/search/index.ts`): typed wrapper indexing `title`/`platform`/`fileName` with fuzzy and prefix search, returning full `RomEntry` objects.
- UI components: responsive header/search bar, sidebar filter panel (platform, year range, file extension, sort), and a result card (title, platform badge, year, file size, download button), wired together in `App.svelte` with client-side filtering, sorting, and lazy per-platform catalog loading.
- `.github/workflows/deploy.yml` now runs `npm run build` and copies `/data` into the build output before publishing to GitHub Pages.
- `.github/pull_request_template.md`: checklist covering typecheck/lint/test, schema versioning, the Archive.org type boundary rule, and roadmap/changelog upkeep.
- Job summary on `.github/workflows/index.yml` runs: a per-platform table of total/new/updated/removed entries and errors, written to `$GITHUB_STEP_SUMMARY`.
- `diffCatalogEntries` in `scripts/lib/output.ts`: compares the previous `/data/{platform}.json` on disk against the newly indexed entries (by `id`, `md5`, and file size) to compute added/updated/removed counts.
- Vite build cache (`actions/cache` on `node_modules/.vite`) in `.github/workflows/deploy.yml`.
- Branch protection on `main` requiring the CI `quality` check to pass.
- Row-based virtual scrolling for the result grid (`src/app/components/VirtualResultGrid.svelte`, via `@tanstack/svelte-virtual`), rendering only the rows near the viewport regardless of how many entries match the current filters.
- Skeleton loading state (`src/app/components/ResultCardSkeleton.svelte`) shown while the first platform catalogs are loading.
- Download confirmation modal (`src/app/components/DownloadModal.svelte`): shows file name, size, and MD5 checksum before downloading, with copy-to-clipboard buttons for the direct download link and the MD5 checksum. The result card's download button now opens this modal instead of linking directly.
- Accessibility: a visually-hidden, associated label for the search field; `aria-label`/`aria-labelledby` landmarks and headings tying each filter control to its section in `FilterPanel.svelte`; a polite live region in `App.svelte` announcing the current result count; `role="list"`/`role="listitem"` on the virtualized result grid; `aria-labelledby` on the download modal tied to its heading, plus a labeled MD5-copy button and download-link field. Audited with axe-core (0 violations, list view and with the download modal open) and manual keyboard testing (tab order, dialog focus trap, Escape-to-close, and focus returning to the triggering button on close).

### Changed

- Search now combines query terms with `AND` and disables fuzzy matching on short terms (`src/app/search/index.ts`), fixing results that matched almost every entry when a query contained short, very common words.
- Renamed the package to `gamesroms` in `package.json`.
- Removed all comments (JSDoc and inline) from source and test files.

### Fixed

- `src/tsconfig.json` no longer pulls the Node-only `src/utils/id.ts` (uses `node:crypto`) into the frontend type-checking project.
- ESLint configuration now declares Node globals for the indexer/tests and browser globals for the frontend, and disables the non-type-aware `no-undef` rule in favor of TypeScript's own checks, removing spurious `no-undef` failures on `NodeJS`, `RequestInit`, `console`, `fetch`, `setTimeout`, and similar ambient types/globals.
- `src/utils/http.ts` builds request headers via the `Headers` API instead of spreading `RequestInit.headers` (which can be array-shaped) into a plain object.
- Replaced a `while (true)` pagination loop in `scripts/lib/discover.ts` with an equivalent `for` loop, removing the need for an ESLint suppression comment.
- Removed non-null assertions and non-awaited `async` test helpers in `tests/indexer/*.test.ts` flagged by strict-type-checked lint rules.
- `scripts/config.ts` now treats empty-string environment variables (as GitHub Actions sets for unset repository variables referenced via `vars.*`) the same as unset ones, applying their defaults instead of failing schema validation. This was causing every `Index` workflow run to crash immediately with "Invalid indexer environment configuration".
- `VirtualResultGrid.svelte` no longer re-subscribes to its own virtualizer store inside the effect that configures it, which caused an infinite `effect_update_depth_exceeded` loop and prevented any rows (and the download modal, which is nested under a row) from ever rendering.
