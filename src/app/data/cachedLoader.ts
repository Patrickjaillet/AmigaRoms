import type { PlatformCatalog, SearchIndexManifest } from "../../types/rom.js";
import { loadManifest, loadPlatformCatalog, type DataLoadError } from "./loader.js";
import { cachePlatformCatalog, getCachedCatalog } from "../cache/db.js";
import { type Result, ok, err } from "../../utils/result.js";

export interface CatalogSource {
  readonly catalog: PlatformCatalog;
  readonly fromCache: boolean;
}

export async function loadPlatformCatalogWithCache(
  platform: string,
  manifest: SearchIndexManifest | null,
): Promise<Result<CatalogSource, DataLoadError>> {
  const manifestEntry = manifest?.platforms.find((p) => p.platform === platform);
  const cached = await getCachedCatalog(platform);

  if (cached && manifestEntry && cached.checksum === manifestEntry.checksum) {
    return ok({ catalog: cached.catalog, fromCache: true });
  }

  const fresh = await loadPlatformCatalog(platform);
  if (fresh.ok) {
    if (manifestEntry) {
      await cachePlatformCatalog(fresh.value, manifestEntry.checksum);
    }
    return ok({ catalog: fresh.value, fromCache: false });
  }

  if (cached) {
    return ok({ catalog: cached.catalog, fromCache: true });
  }

  return err(fresh.error);
}

export async function loadManifestOrNull(): Promise<SearchIndexManifest | null> {
  const result = await loadManifest();
  return result.ok ? result.value : null;
}
