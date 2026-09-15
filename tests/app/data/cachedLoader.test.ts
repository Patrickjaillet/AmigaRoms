import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { openDB } from "idb";
import type { PlatformCatalog, SearchIndexManifest } from "../../../src/types/rom.js";
import { getCachedCatalog } from "../../../src/app/cache/db.js";
import { loadPlatformCatalogWithCache } from "../../../src/app/data/cachedLoader.js";

const catalogV1: PlatformCatalog = {
  schemaVersion: 1,
  platform: "amiga",
  totalEntries: 1,
  lastUpdated: "2026-01-01T00:00:00.000Z",
  entries: [
    {
      id: "a1",
      title: "Zool",
      platform: "amiga",
      year: 1992,
      collection: "softwarelibrary_amiga",
      fileName: "Zool.zip",
      fileExtension: "zip",
      fileSizeBytes: 1000,
      downloadUrl: "https://example.org/Zool.zip",
      archiveIdentifier: "item-1",
      md5: "aaa",
      indexedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

const [firstEntry] = catalogV1.entries;
if (!firstEntry) {
  throw new Error("catalogV1 must have at least one entry");
}

const catalogV2: PlatformCatalog = {
  ...catalogV1,
  totalEntries: 2,
  entries: [...catalogV1.entries, { ...firstEntry, id: "a2", title: "Alien Breed" }],
};

function manifestWithChecksum(checksum: string): SearchIndexManifest {
  return {
    schemaVersion: 1,
    generatedAt: "2026-01-01T00:00:00.000Z",
    platforms: [
      {
        platform: "amiga",
        file: "amiga.json",
        entryCount: catalogV1.entries.length,
        checksum,
        lastUpdated: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(async () => {
  await getCachedCatalog("__ensure-db-exists__");
  const db = await openDB("amigaroms-cache", 1);
  await db.clear("platforms");
  await db.clear("searchIndexMeta");
  db.close();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function runWithFakeTimers<T>(work: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  const promise = work();
  await vi.runAllTimersAsync();
  return promise;
}

describe("loadPlatformCatalogWithCache", () => {
  it("fetches fresh and caches it when nothing is cached yet", async () => {
    const fetchMock = vi.fn(() => jsonResponse(catalogV1));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromCache).toBe(false);
      expect(result.value.catalog).toEqual(catalogV1);
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("serves from cache without fetching when the checksum matches the manifest", async () => {
    const fetchMock = vi.fn(() => jsonResponse(catalogV1));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1"));
    fetchMock.mockClear();

    const result = await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromCache).toBe(true);
      expect(result.value.catalog).toEqual(catalogV1);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("revalidates and re-fetches when the manifest checksum has changed", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse(catalogV1))
      .mockImplementationOnce(() => jsonResponse(catalogV2));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1"));

    const result = await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-2"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromCache).toBe(false);
      expect(result.value.catalog.totalEntries).toBe(2);
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to a stale cached catalog when the network fetch fails", async () => {
    const fetchMock = vi.fn(() => jsonResponse(catalogV1));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1"));

    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );

    const result = await runWithFakeTimers(() =>
      loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-2")),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromCache).toBe(true);
      expect(result.value.catalog).toEqual(catalogV1);
    }
  });

  it("returns a typed error when there is no cache and the network fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );

    const result = await runWithFakeTimers(() =>
      loadPlatformCatalogWithCache("amiga", manifestWithChecksum("checksum-1")),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("network");
    }
  });
});
