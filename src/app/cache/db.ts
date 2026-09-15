import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PlatformCatalog } from "../../types/rom.js";

export const CACHE_SCHEMA_VERSION = 1;

interface CachedPlatformEntry {
  readonly platform: string;
  readonly checksum: string;
  readonly catalog: PlatformCatalog;
  readonly cachedAt: string;
}

interface CachedSearchIndexMeta {
  readonly key: "manifest";
  readonly schemaVersion: number;
  readonly generatedAt: string;
}

interface GamesRomsDB extends DBSchema {
  platforms: {
    key: string;
    value: CachedPlatformEntry;
  };
  searchIndexMeta: {
    key: string;
    value: CachedSearchIndexMeta;
  };
}

let dbPromise: Promise<IDBPDatabase<GamesRomsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<GamesRomsDB>> {
  dbPromise ??= openDB<GamesRomsDB>("gamesroms-cache", CACHE_SCHEMA_VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore("platforms", { keyPath: "platform" });
        database.createObjectStore("searchIndexMeta", { keyPath: "key" });
      }
    },
  });
  return dbPromise;
}

export async function cachePlatformCatalog(
  catalog: PlatformCatalog,
  checksum: string,
): Promise<void> {
  const db = await getDb();
  const entry: CachedPlatformEntry = {
    platform: catalog.platform,
    checksum,
    catalog,
    cachedAt: new Date().toISOString(),
  };
  await db.put("platforms", entry);
}

export async function getCachedCatalog(
  platform: string,
): Promise<{ readonly catalog: PlatformCatalog; readonly checksum: string } | undefined> {
  const db = await getDb();
  const entry = await db.get("platforms", platform);
  return entry ? { catalog: entry.catalog, checksum: entry.checksum } : undefined;
}

export async function cacheManifestMeta(schemaVersion: number, generatedAt: string): Promise<void> {
  const db = await getDb();
  const entry: CachedSearchIndexMeta = { key: "manifest", schemaVersion, generatedAt };
  await db.put("searchIndexMeta", entry);
}

export async function getCachedManifestMeta(): Promise<CachedSearchIndexMeta | undefined> {
  const db = await getDb();
  return db.get("searchIndexMeta", "manifest");
}
