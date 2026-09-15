import {
  PlatformCatalogSchema,
  SearchIndexManifestSchema,
  type PlatformCatalog,
  type SearchIndexManifest,
} from "../../types/rom.js";
import { err, ok, type Result } from "../../utils/result.js";

export type DataLoadError =
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "http-status"; readonly status: number }
  | { readonly kind: "invalid-json" }
  | { readonly kind: "schema-validation"; readonly issues: readonly string[] };

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  baseDelayMs: 400,
  maxDelayMs: 2_000,
};

function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function backoffDelay(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * options.baseDelayMs;
  return Math.min(exponential + jitter, options.maxDelayMs);
}

async function fetchAndValidate<T>(
  url: string,
  schema: {
    safeParse: (raw: unknown) =>
      | { success: true; data: T }
      | {
          success: false;
          error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
        };
  },
  retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
): Promise<Result<T, DataLoadError>> {
  let lastError: DataLoadError = { kind: "network", message: "unreachable" };

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (cause) {
      lastError = {
        kind: "network",
        message: cause instanceof Error ? cause.message : String(cause),
      };
      if (attempt < retryOptions.maxRetries) {
        await sleep(backoffDelay(attempt, retryOptions));
        continue;
      }
      return err(lastError);
    }

    if (!response.ok) {
      lastError = { kind: "http-status", status: response.status };
      if (isRetryableStatus(response.status) && attempt < retryOptions.maxRetries) {
        await sleep(backoffDelay(attempt, retryOptions));
        continue;
      }
      return err(lastError);
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      return err({ kind: "invalid-json" });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return err({
        kind: "schema-validation",
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
        ),
      });
    }

    return ok(parsed.data);
  }

  return err(lastError);
}

export async function loadManifest(): Promise<Result<SearchIndexManifest, DataLoadError>> {
  return fetchAndValidate(dataUrl("manifest.json"), SearchIndexManifestSchema);
}

export async function loadPlatformCatalog(
  platform: string,
): Promise<Result<PlatformCatalog, DataLoadError>> {
  return fetchAndValidate(dataUrl(`${platform}.json`), PlatformCatalogSchema);
}
