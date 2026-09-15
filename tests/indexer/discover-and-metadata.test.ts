import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverItems } from "../../scripts/lib/discover.js";
import { fetchItemMetadata } from "../../scripts/lib/metadata.js";
import { createLimiter } from "../../src/utils/concurrency.js";
import { getPlatformConfig } from "../../src/config/platforms.config.js";
import itemMetadataFixture from "../fixtures/archive-item-metadata.sample.json" with { type: "json" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("discoverItems (mocked fetch)", () => {
  it("paginates until a page returns fewer than ROWS_PER_PAGE docs and dedupes across collections", async () => {
    const page1Docs = Array.from({ length: 100 }, (_, i) => ({ identifier: `item-${String(i)}` }));
    const page2Docs = [{ identifier: "item-100" }, { identifier: "item-0" }];

    const fetchMock = vi.fn((url: string) => {
      if (url.includes("page=1")) {
        return jsonResponse({
          responseHeader: { status: 0, QTime: 1 },
          response: { numFound: 102, start: 0, docs: page1Docs },
        });
      }
      return jsonResponse({
        responseHeader: { status: 0, QTime: 1 },
        response: { numFound: 102, start: 100, docs: page2Docs },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const amiga = getPlatformConfig("amiga");
    if (!amiga) {
      throw new Error("amiga platform config not found");
    }
    const limiter = createLimiter(4);
    const result = await discoverItems(amiga, { baseUrl: "https://archive.org", limiter });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toContain("item-100");
      expect(new Set(result.value).size).toBe(result.value.length);
    }
  });

  it("stops once numFound is reached even when every page is exactly full, instead of paginating forever", async () => {
    let requestedPages = 0;
    const fetchMock = vi.fn((url: string) => {
      requestedPages += 1;
      const collectionMatch = /collection%3A(\w+)/.exec(url);
      const collection = collectionMatch?.[1] ?? "unknown";
      const pageMatch = /page=(\d+)/.exec(url);
      const page = pageMatch?.[1] ? Number.parseInt(pageMatch[1], 10) : 1;
      const docs = Array.from({ length: 100 }, (_, i) => ({
        identifier: `${collection}-item-${String((page - 1) * 100 + i)}`,
      }));
      return jsonResponse({
        responseHeader: { status: 0, QTime: 1 },
        response: { numFound: 300, start: (page - 1) * 100, docs },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const amiga = getPlatformConfig("amiga");
    if (!amiga) {
      throw new Error("amiga platform config not found");
    }
    const limiter = createLimiter(4);
    const result = await discoverItems(amiga, { baseUrl: "https://archive.org", limiter });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(300 * amiga.archiveCollections.length);
    }
    expect(requestedPages).toBeLessThanOrEqual(3 * amiga.archiveCollections.length);
  });

  it("collects a discovery error without throwing when a page request fails", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ error: "boom" }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const amiga = getPlatformConfig("amiga");
    if (!amiga) {
      throw new Error("amiga platform config not found");
    }
    const limiter = createLimiter(2);
    const result = await discoverItems(amiga, {
      baseUrl: "https://archive.org",
      limiter,
      retryOptions: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1 },
    });

    expect(result.ok).toBe(false);
  });
});

describe("fetchItemMetadata (mocked fetch)", () => {
  it("validates a successful metadata response", async () => {
    const fetchMock = vi.fn(() => jsonResponse(itemMetadataFixture));
    vi.stubGlobal("fetch", fetchMock);

    const limiter = createLimiter(1);
    const result = await fetchItemMetadata("softwarelibrary_amiga_workbench", {
      baseUrl: "https://archive.org",
      limiter,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.metadata.identifier).toBe("softwarelibrary_amiga_workbench");
    }
  });

  it("returns a typed error on a 404", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ error: "not found" }, 404));
    vi.stubGlobal("fetch", fetchMock);

    const limiter = createLimiter(1);
    const result = await fetchItemMetadata("does-not-exist", {
      baseUrl: "https://archive.org",
      limiter,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("http-status");
    }
  });
});
