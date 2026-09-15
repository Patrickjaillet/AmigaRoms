import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeManifest, writePlatformCatalog } from "../../scripts/lib/output.js";
import type { RomEntry } from "../../src/types/rom.js";

const FIXED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "rom-archive-explorer-output-"));
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

const sampleEntry: RomEntry = {
  id: "abc123",
  title: "Amiga Workbench 1.3",
  platform: "amiga",
  year: 1988,
  collection: "softwarelibrary_amiga",
  fileName: "Workbench_1.3.adf",
  fileExtension: "adf",
  fileSizeBytes: 901120,
  downloadUrl: "https://ia601504.us.archive.org/29/items/softwarelibrary_amiga_workbench/Workbench_1.3.adf",
  archiveIdentifier: "softwarelibrary_amiga_workbench",
  md5: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  indexedAt: FIXED_TIMESTAMP,
};

describe("writePlatformCatalog", () => {
  it("writes a schema-valid, deterministically shaped JSON file", async () => {
    const result = await writePlatformCatalog("amiga", [sampleEntry], dataDir, FIXED_TIMESTAMP);
    expect(result.ok).toBe(true);

    const written = await readFile(path.join(dataDir, "amiga.json"), "utf-8");
    expect(JSON.parse(written)).toMatchSnapshot();
  });

  it("rejects and reports issues for an entry that fails schema validation", async () => {
    const invalidEntry = { ...sampleEntry, fileSizeBytes: -1 };
    const result = await writePlatformCatalog("amiga", [invalidEntry], dataDir, FIXED_TIMESTAMP);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("writeManifest", () => {
  it("writes a schema-valid manifest referencing platform files", async () => {
    const result = await writeManifest(
      [{ platform: "amiga", file: "amiga.json", entryCount: 1, checksum: "deadbeef", lastUpdated: FIXED_TIMESTAMP }],
      dataDir,
      FIXED_TIMESTAMP,
    );
    expect(result.ok).toBe(true);

    const written = await readFile(path.join(dataDir, "manifest.json"), "utf-8");
    expect(JSON.parse(written)).toMatchSnapshot();
  });
});
