## Summary

<!-- What does this change do, and why? -->

## Checklist

- [ ] `npm run typecheck` passes (includes `svelte-check` for the frontend)
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run test` passes
- [ ] Any change to `RomEntry`, `PlatformCatalog`, or `SearchIndexManifest` bumps `CURRENT_SCHEMA_VERSION` in `src/types/rom.ts` and is documented in `ARCHITECTURE.md`
- [ ] No raw Archive.org shapes (`src/types/archive-org.ts`) are imported outside `scripts/` (see `ARCHITECTURE.md` boundary rule)
- [ ] `ROADMAP.md` reflects any feature added; `CHANGELOG.md` reflects the change
