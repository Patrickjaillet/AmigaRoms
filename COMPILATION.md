# Compilation

## Requirements

- Node.js >= 20
- npm

## Install dependencies

```
npm install
```

## Type checking

```
npm run typecheck
```

Runs `tsc --noEmit` against both the indexer project (`scripts/tsconfig.json`) and the frontend project (`src/tsconfig.json`).

## Lint and format

```
npm run lint
npm run format
```

## Tests

```
npm run test
npm run test:watch
```

## Run the indexer

```
npm run index
npm run index:platform -- --platform=<id>
```

Optional flags: `--dry-run`, `--force-full-reindex`.

Runtime configuration is read from environment variables: `REQUEST_DELAY_MS`, `MAX_CONCURRENT_REQUESTS`, `ARCHIVE_ORG_BASE_URL`, `INDEXER_MAX_RETRIES`.

## Build the frontend

```
npm run build
```

Produces a production build via Vite into `dist/`.

## Development server

```
npm run dev
```

Starts the Vite development server for the frontend.

## CI/CD workflows

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| CI | `.github/workflows/ci.yml` | push to `main`, every pull request | `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test` |
| Index | `.github/workflows/index.yml` | weekly cron (Monday 03:00 UTC), manual dispatch | Runs the indexer and commits updated `/data/*.json` when the output changes |
| Deploy Pages | `.github/workflows/deploy.yml` | push to `main`, manual dispatch | Publishes `/public` to GitHub Pages |

No repository secrets are required: the indexer talks to Archive.org's public, unauthenticated API. The Index workflow reads its runtime tuning from repository **variables** (Settings → Secrets and variables → Actions → Variables), all optional and defaulting as documented in `scripts/config.ts` when unset:

| Variable | Default | Purpose |
|---|---|---|
| `ARCHIVE_ORG_BASE_URL` | `https://archive.org` | Base URL for the Advanced Search and Metadata APIs |
| `MAX_CONCURRENT_REQUESTS` | `4` | Concurrency limit for outgoing Archive.org requests |
| `REQUEST_DELAY_MS` | `250` | Delay between requests, to respect Archive.org rate limits |
| `INDEXER_MAX_RETRIES` | `4` | Max retry attempts on transient (429/5xx) failures |

The Index workflow runs with `contents: write` permission (to commit `/data/*.json`); the Deploy Pages workflow runs with `pages: write` and `id-token: write`; the CI workflow is read-only (`contents: read`). Each workflow requests only the permissions it needs.
