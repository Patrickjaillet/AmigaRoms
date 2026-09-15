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

### Changed

- Renamed the package to `gamesroms` in `package.json`.
- Removed all comments (JSDoc and inline) from source and test files.

### Fixed

- `src/tsconfig.json` no longer pulls the Node-only `src/utils/id.ts` (uses `node:crypto`) into the frontend type-checking project.
- ESLint configuration now declares Node globals for the indexer/tests and browser globals for the frontend, and disables the non-type-aware `no-undef` rule in favor of TypeScript's own checks, removing spurious `no-undef` failures on `NodeJS`, `RequestInit`, `console`, `fetch`, `setTimeout`, and similar ambient types/globals.
- `src/utils/http.ts` builds request headers via the `Headers` API instead of spreading `RequestInit.headers` (which can be array-shaped) into a plain object.
- Replaced a `while (true)` pagination loop in `scripts/lib/discover.ts` with an equivalent `for` loop, removing the need for an ESLint suppression comment.
- Removed non-null assertions and non-awaited `async` test helpers in `tests/indexer/*.test.ts` flagged by strict-type-checked lint rules.
