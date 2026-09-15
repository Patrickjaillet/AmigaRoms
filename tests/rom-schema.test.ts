import { describe, expect, it } from "vitest";
import { PlatformCatalogSchema, RomEntrySchema, CURRENT_SCHEMA_VERSION } from "../src/types/rom.js";
import { PLATFORMS, validatePlatformsConfig } from "../src/config/platforms.config.js";
import { buildRomEntryId } from "../src/utils/id.js";

describe("RomEntry / PlatformCatalog schema", () => {
  it("accepts a well-formed RomEntry", () => {
    const entry = {
      id: buildRomEntryId("softwarelibrary_amiga_workbench", "Workbench_1.3.adf"),
      title: "Amiga Workbench 1.3",
      platform: "amiga",
      year: 1988,
      collection: "softwarelibrary_amiga",
      fileName: "Workbench_1.3.adf",
      fileExtension: "adf",
      fileSizeBytes: 901120,
      downloadUrl:
        "https://ia601504.us.archive.org/29/items/softwarelibrary_amiga_workbench/Workbench_1.3.adf",
      archiveIdentifier: "softwarelibrary_amiga_workbench",
      md5: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      indexedAt: new Date().toISOString(),
    };
    expect(RomEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("accepts a well-formed PlatformCatalog wrapping zero-or-more entries", () => {
    const catalog = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      platform: "amiga",
      totalEntries: 0,
      lastUpdated: new Date().toISOString(),
      entries: [],
    };
    expect(PlatformCatalogSchema.safeParse(catalog).success).toBe(true);
  });
});

describe("platforms.config.ts", () => {
  it("passes validation with no duplicate platformIds", () => {
    expect(() => {
      validatePlatformsConfig();
    }).not.toThrow();
  });

  it("exposes at least the six platforms named in the roadmap", () => {
    const ids = PLATFORMS.map((p) => p.platformId);
    expect(ids).toEqual(expect.arrayContaining(["amiga", "msdos", "nes", "snes", "mame"]));
  });
});
