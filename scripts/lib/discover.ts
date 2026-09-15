import { ArchiveOrgSearchResponseSchema } from "../../src/types/archive-org.js";
import type { PlatformConfig } from "../../src/config/platforms.config.js";
import { fetchJson, DEFAULT_RETRY_OPTIONS, type FetchJsonError, type RetryOptions } from "../../src/utils/http.js";
import type { Limiter } from "../../src/utils/concurrency.js";
import { ok, err, type Result } from "../../src/utils/result.js";

const ROWS_PER_PAGE = 100;

export interface DiscoverDeps {
  readonly baseUrl: string;
  readonly limiter: Limiter;
  readonly retryOptions?: RetryOptions;
}

export interface DiscoveryError {
  readonly collection: string;
  readonly page: number;
  readonly cause: FetchJsonError;
}

function buildSearchUrl(baseUrl: string, collection: string, page: number): string {
  const params = new URLSearchParams({
    q: `collection:${collection}`,
    fl: "identifier",
    rows: String(ROWS_PER_PAGE),
    page: String(page),
    output: "json",
  });
  return `${baseUrl}/advancedsearch.php?${params.toString()}`;
}

export async function discoverItems(
  platform: PlatformConfig,
  deps: DiscoverDeps,
): Promise<Result<readonly string[], readonly DiscoveryError[]>> {
  const identifiers = new Set<string>();
  const errors: DiscoveryError[] = [];

  for (const collection of platform.archiveCollections) {
    for (let page = 1; ; page += 1) {
      const url = buildSearchUrl(deps.baseUrl, collection, page);
      const result = await deps.limiter(() =>
        fetchJson(url, ArchiveOrgSearchResponseSchema, {}, deps.retryOptions ?? DEFAULT_RETRY_OPTIONS),
      );

      if (!result.ok) {
        errors.push({ collection, page, cause: result.error });
        break;
      }

      for (const doc of result.value.response.docs) {
        identifiers.add(doc.identifier);
      }

      if (result.value.response.docs.length < ROWS_PER_PAGE) {
        break;
      }
    }
  }

  if (identifiers.size === 0 && errors.length > 0) {
    return err(errors);
  }
  return ok(Array.from(identifiers));
}
