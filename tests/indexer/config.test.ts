import { describe, expect, it } from "vitest";
import { loadIndexerConfig } from "../../scripts/config.js";

describe("loadIndexerConfig", () => {
  it("applies defaults when no environment variables are set", () => {
    const config = loadIndexerConfig({});
    expect(config.archiveOrgBaseUrl).toBe("https://archive.org");
    expect(config.maxConcurrentRequests).toBe(4);
    expect(config.requestDelayMs).toBe(250);
  });

  it("applies defaults when environment variables are set but empty, as GitHub Actions does for unset repository variables", () => {
    const config = loadIndexerConfig({
      ARCHIVE_ORG_BASE_URL: "",
      MAX_CONCURRENT_REQUESTS: "",
      REQUEST_DELAY_MS: "",
      INDEXER_MAX_RETRIES: "",
    });
    expect(config.archiveOrgBaseUrl).toBe("https://archive.org");
    expect(config.maxConcurrentRequests).toBe(4);
  });

  it("uses provided non-empty values over the defaults", () => {
    const config = loadIndexerConfig({
      ARCHIVE_ORG_BASE_URL: "https://example.org",
      MAX_CONCURRENT_REQUESTS: "10",
    });
    expect(config.archiveOrgBaseUrl).toBe("https://example.org");
    expect(config.maxConcurrentRequests).toBe(10);
  });

  it("throws with a readable message on an invalid non-empty value", () => {
    expect(() => {
      loadIndexerConfig({ ARCHIVE_ORG_BASE_URL: "not-a-url" });
    }).toThrow(/ARCHIVE_ORG_BASE_URL/);
  });
});
