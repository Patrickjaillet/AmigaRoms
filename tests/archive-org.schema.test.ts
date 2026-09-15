import { describe, expect, it } from "vitest";
import {
  ArchiveOrgItemMetadataSchema,
  ArchiveOrgSearchResponseSchema,
  validateArchiveOrgResponse,
} from "../src/types/archive-org.js";
import itemMetadataFixture from "./fixtures/archive-item-metadata.sample.json" with { type: "json" };

describe("ArchiveOrgItemMetadataSchema", () => {
  it("parses a real /metadata/{identifier} response fixture", () => {
    const result = validateArchiveOrgResponse(ArchiveOrgItemMetadataSchema, itemMetadataFixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.metadata.identifier).toBe("softwarelibrary_amiga_workbench");
      expect(result.data.files).toHaveLength(3);
    }
  });

  it("rejects a response missing required fields", () => {
    const malformed = { server: "ia601504.us.archive.org" }; // missing dir/files/metadata
    const result = validateArchiveOrgResponse(ArchiveOrgItemMetadataSchema, malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("ArchiveOrgSearchResponseSchema", () => {
  it("parses a minimal advancedsearch.php response", () => {
    const sample = {
      responseHeader: { status: 0, QTime: 12 },
      response: {
        numFound: 1,
        start: 0,
        docs: [{ identifier: "softwarelibrary_amiga_workbench", title: "Amiga Workbench 1.3" }],
      },
    };
    const result = validateArchiveOrgResponse(ArchiveOrgSearchResponseSchema, sample);
    expect(result.ok).toBe(true);
  });
});
