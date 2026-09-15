import { ArchiveOrgItemMetadataSchema, type ArchiveOrgItemMetadata } from "../../src/types/archive-org.js";
import { fetchJson, DEFAULT_RETRY_OPTIONS, type FetchJsonError, type RetryOptions } from "../../src/utils/http.js";
import type { Limiter } from "../../src/utils/concurrency.js";
import { type Result } from "../../src/utils/result.js";

export interface MetadataDeps {
  readonly baseUrl: string;
  readonly limiter: Limiter;
  readonly retryOptions?: RetryOptions;
}

export async function fetchItemMetadata(
  identifier: string,
  deps: MetadataDeps,
): Promise<Result<ArchiveOrgItemMetadata, FetchJsonError>> {
  const url = `${deps.baseUrl}/metadata/${encodeURIComponent(identifier)}`;
  return deps.limiter(() =>
    fetchJson(url, ArchiveOrgItemMetadataSchema, {}, deps.retryOptions ?? DEFAULT_RETRY_OPTIONS),
  );
}
