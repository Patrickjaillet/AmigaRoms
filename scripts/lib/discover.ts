import {
  ArchiveOrgSearchResponseSchema,
  type ArchiveOrgSearchResponse,
} from "../../src/types/archive-org.js";
import type { PlatformConfig } from "../../src/config/platforms.config.js";
import {
  fetchJson,
  DEFAULT_RETRY_OPTIONS,
  type FetchJsonError,
  type RetryOptions,
} from "../../src/utils/http.js";
import type { Limiter } from "../../src/utils/concurrency.js";
import { ok, err, type Result } from "../../src/utils/result.js";

const ROWS_PER_PAGE = 100;
const MAX_PAGES_PER_COLLECTION = 2000;

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

async function fetchPage(
  baseUrl: string,
  collection: string,
  page: number,
  deps: DiscoverDeps,
): Promise<Result<ArchiveOrgSearchResponse, FetchJsonError>> {
  const url = buildSearchUrl(baseUrl, collection, page);
  return deps.limiter(() =>
    fetchJson(url, ArchiveOrgSearchResponseSchema, {}, deps.retryOptions ?? DEFAULT_RETRY_OPTIONS),
  );
}

async function discoverCollection(
  collection: string,
  deps: DiscoverDeps,
): Promise<{ identifiers: readonly string[]; errors: readonly DiscoveryError[] }> {
  const identifiers = new Set<string>();
  const errors: DiscoveryError[] = [];

  const firstPage = await fetchPage(deps.baseUrl, collection, 1, deps);
  if (!firstPage.ok) {
    errors.push({ collection, page: 1, cause: firstPage.error });
    return { identifiers: [], errors };
  }

  for (const doc of firstPage.value.response.docs) {
    identifiers.add(doc.identifier);
  }

  const { numFound } = firstPage.value.response;
  const docsOnFirstPage = firstPage.value.response.docs.length;
  const totalPages = Math.min(Math.ceil(numFound / ROWS_PER_PAGE), MAX_PAGES_PER_COLLECTION);

  if (docsOnFirstPage < ROWS_PER_PAGE || totalPages <= 1) {
    return { identifiers: Array.from(identifiers), errors };
  }

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const results = await Promise.all(
    remainingPages.map((page) => fetchPage(deps.baseUrl, collection, page, deps)),
  );

  for (const [index, result] of results.entries()) {
    const page = remainingPages[index];
    if (page === undefined) {
      continue;
    }
    if (!result.ok) {
      errors.push({ collection, page, cause: result.error });
      continue;
    }
    for (const doc of result.value.response.docs) {
      identifiers.add(doc.identifier);
    }
  }

  return { identifiers: Array.from(identifiers), errors };
}

export async function discoverItems(
  platform: PlatformConfig,
  deps: DiscoverDeps,
): Promise<Result<readonly string[], readonly DiscoveryError[]>> {
  const identifiers = new Set<string>();
  const errors: DiscoveryError[] = [];

  const collectionResults = await Promise.all(
    platform.archiveCollections.map((collection) => discoverCollection(collection, deps)),
  );

  for (const collectionResult of collectionResults) {
    for (const identifier of collectionResult.identifiers) {
      identifiers.add(identifier);
    }
    errors.push(...collectionResult.errors);
  }

  if (identifiers.size === 0 && errors.length > 0) {
    return err(errors);
  }
  return ok(Array.from(identifiers));
}
