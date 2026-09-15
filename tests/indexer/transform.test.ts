import { describe, expect, it } from "vitest";
import { itemMetadataToRomEntries, deduplicateAndSort } from "../../scripts/lib/transform.js";
import { ArchiveOrgItemMetadataSchema } from "../../src/types/archive-org.js";
import { getPlatformConfig, type PlatformConfig } from "../../src/config/platforms.config.js";
import itemMetadataFixture from "../fixtures/archive-item-metadata.sample.json" with { type: "json" };

const FIXED_INDEXED_AT = "2026-01-01T00:00:00.000Z";

describe("itemMetadataToRomEntries", () => {
  it("keeps only allowed extensions and derives fields correctly", () => {
    const metadata = ArchiveOrgItemMetadataSchema.parse(itemMetadataFixture);
    const amiga = getPlatformConfig("amiga");
    if (!amiga) throw new Error("amiga platform config missing");

    const entries = itemMetadataToRomEntries(metadata, amiga, FIXED_INDEXED_AT);

    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.fileExtension).sort()).toEqual(["adf", "zip"]);

    const adfEntry = entries.find((e) => e.fileExtension === "adf");
    expect(adfEntry).toMatchObject({
      title: "Amiga Workbench 1.3",
      platform: "amiga",
      year: 1988,
      archiveIdentifier: "softwarelibrary_amiga_workbench",
      fileName: "Workbench_1.3.adf",
      fileSizeBytes: 901120,
      md5: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      downloadUrl:
        "https://ia601504.us.archive.org/29/items/softwarelibrary_amiga_workbench/Workbench_1.3.adf",
      indexedAt: FIXED_INDEXED_AT,
    });
  });

  it("falls back to the identifier as title when metadata.title is missing", () => {
    const metadata = ArchiveOrgItemMetadataSchema.parse({
      ...itemMetadataFixture,
      metadata: { ...itemMetadataFixture.metadata, title: undefined },
    });
    const amiga = getPlatformConfig("amiga");
    if (!amiga) throw new Error("amiga platform config missing");
    const [entry] = itemMetadataToRomEntries(metadata, amiga, FIXED_INDEXED_AT);
    expect(entry?.title).toBe("softwarelibrary_amiga_workbench");
  });

  it("filters out extensions not in the platform's allow-list", () => {
    const metadata = ArchiveOrgItemMetadataSchema.parse(itemMetadataFixture);
    const zipOnlyPlatform: PlatformConfig = {
      platformId: "amiga",
      displayName: "Commodore Amiga",
      archiveCollections: ["softwarelibrary_amiga"],
      allowedExtensions: ["zip"],
    };
    const entries = itemMetadataToRomEntries(metadata, zipOnlyPlatform, FIXED_INDEXED_AT);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.fileExtension).toBe("zip");
  });
});

describe("deduplicateAndSort", () => {
  it("removes entries with a duplicate md5 and sorts by title", () => {
    const base = {
      id: "x",
      platform: "amiga",
      year: 1990,
      collection: "softwarelibrary_amiga",
      fileName: "a.adf",
      fileExtension: "adf",
      fileSizeBytes: 100,
      downloadUrl: "https://example.org/a.adf",
      archiveIdentifier: "item-a",
      indexedAt: FIXED_INDEXED_AT,
    };
    const entries = [
      { ...base, id: "1", title: "Zool", md5: "aaa" },
      { ...base, id: "2", title: "Another Zool copy", md5: "aaa" },
      { ...base, id: "3", title: "Alien Breed", md5: "bbb" },
      { ...base, id: "4", title: "Cannon Fodder", md5: null },
    ];

    const result = deduplicateAndSort(entries);
    expect(result.map((e) => e.title)).toEqual(["Alien Breed", "Cannon Fodder", "Zool"]);
  });
});
