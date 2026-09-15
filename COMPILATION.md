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
