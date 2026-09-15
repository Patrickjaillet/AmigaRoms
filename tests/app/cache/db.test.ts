import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { openDB } from "idb";
import type { PlatformCatalog } from "../../../src/types/rom.js";
import {
  cacheManifestMeta,
  cachePlatformCatalog,
  getCachedCatalog,
  getCachedManifestMeta,
} from "../../../src/app/cache/db.js";

const sampleCatalog: PlatformCatalog = {
  schemaVersion: 1,
  platform: "amiga",
  totalEntries: 0,
  lastUpdated: "2026-01-01T00:00:00.000Z",
  entries: [],
};

beforeEach(async () => {
  await getCachedCatalog("__ensure-db-exists__");
  const db = await openDB("amigaroms-cache", 1);
  await db.clear("platforms");
  await db.clear("searchIndexMeta");
  db.close();
});

describe("IndexedDB cache", () => {
  it("returns undefined for a platform that has not been cached", async () => {
    const result = await getCachedCatalog("amiga");
    expect(result).toBeUndefined();
  });

  it("caches and retrieves a platform catalog with its checksum", async () => {
    await cachePlatformCatalog(sampleCatalog, "checksum-1");
    const result = await getCachedCatalog("amiga");
    expect(result).toBeDefined();
    expect(result?.checksum).toBe("checksum-1");
    expect(result?.catalog).toEqual(sampleCatalog);
  });

  it("overwrites a previous cache entry for the same platform", async () => {
    await cachePlatformCatalog(sampleCatalog, "checksum-1");
    const updatedCatalog: PlatformCatalog = { ...sampleCatalog, totalEntries: 5 };
    await cachePlatformCatalog(updatedCatalog, "checksum-2");
    const result = await getCachedCatalog("amiga");
    expect(result?.checksum).toBe("checksum-2");
    expect(result?.catalog.totalEntries).toBe(5);
  });

  it("caches and retrieves manifest metadata", async () => {
    await cacheManifestMeta(1, "2026-01-01T00:00:00.000Z");
    const meta = await getCachedManifestMeta();
    expect(meta).toEqual({
      key: "manifest",
      schemaVersion: 1,
      generatedAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
