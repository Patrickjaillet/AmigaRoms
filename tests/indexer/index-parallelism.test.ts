import { afterEach, describe, expect, it, vi } from "vitest";
import { indexPlatform } from "../../scripts/index.js";
import { createLimiter } from "../../src/utils/concurrency.js";
import { getPlatformConfig } from "../../src/config/platforms.config.js";
import itemMetadataFixture from "../fixtures/archive-item-metadata.sample.json" with { type: "json" };

const FETCH_LATENCY_MS = 50;
const REQUEST_DELAY_MS = 10;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("indexPlatform metadata fetch parallelism", () => {
  it("fetches item metadata concurrently instead of one item at a time", async () => {
    const itemCount = 8;
    const concurrency = 4;

    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/advancedsearch.php")) {
        const docs = Array.from({ length: itemCount }, (_, i) => ({
          identifier: `item-${String(i)}`,
        }));
        return jsonResponse({
          responseHeader: { status: 0, QTime: 1 },
          response: { numFound: docs.length, start: 0, docs },
        });
      }
      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(jsonResponse(itemMetadataFixture));
        }, FETCH_LATENCY_MS);
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const amiga = getPlatformConfig("amiga");
    if (!amiga) {
      throw new Error("amiga platform config not found");
    }

    const limiter = createLimiter(concurrency);
    const startedAt = Date.now();

    const { report } = await indexPlatform(
      amiga,
      {
        baseUrl: "https://archive.org",
        requestDelayMs: REQUEST_DELAY_MS,
        limiter,
        retryOptions: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1 },
        dryRun: true,
      },
      "2026-01-01T00:00:00.000Z",
    );

    const elapsedMs = Date.now() - startedAt;

    expect(report.discoveredIdentifiers).toBe(itemCount);

    const sequentialWorstCaseMs = itemCount * (FETCH_LATENCY_MS + REQUEST_DELAY_MS);
    expect(elapsedMs).toBeLessThan(sequentialWorstCaseMs * 0.7);
  });
});
