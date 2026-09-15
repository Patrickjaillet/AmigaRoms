import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPlatformCatalog } from "../../../src/app/data/loader.js";

const validCatalog = {
  schemaVersion: 1,
  platform: "amiga",
  totalEntries: 0,
  lastUpdated: "2026-01-01T00:00:00.000Z",
  entries: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

describe("loadPlatformCatalog retry behavior", () => {
  it("retries a retryable HTTP status and succeeds once the response recovers", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ error: "boom" }, 503))
      .mockImplementationOnce(() => jsonResponse(validCatalog));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runWithFakeTimers(() => loadPlatformCatalog("amiga"));

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-retryable HTTP status", async () => {
    const fetchMock = vi.fn(() => jsonResponse({ error: "not found" }, 404));
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadPlatformCatalog("amiga");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("http-status");
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up and returns a typed error after exhausting retries on persistent network failure", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("network down")));
    vi.stubGlobal("fetch", fetchMock);

    const result = await runWithFakeTimers(() => loadPlatformCatalog("amiga"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("network");
    }
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });
});
