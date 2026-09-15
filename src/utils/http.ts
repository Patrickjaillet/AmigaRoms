import type { z } from "zod";
import { err, ok, type Result } from "./result.js";

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 4,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
};

export type FetchJsonError =
  | { readonly kind: "network"; readonly message: string }
  | { readonly kind: "http-status"; readonly status: number; readonly url: string }
  | { readonly kind: "invalid-json"; readonly url: string }
  | { readonly kind: "schema-validation"; readonly url: string; readonly issues: readonly string[] };

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

export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
  retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
): Promise<Result<T, FetchJsonError>> {
  let lastError: FetchJsonError = { kind: "network", message: "unreachable" };

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    let response: Response;
    try {
      const headers = new Headers(init.headers);
      headers.set("User-Agent", "rom-archive-explorer-indexer (+contact via repository README)");
      headers.set("Accept", "application/json");
      response = await fetch(url, { ...init, headers });
    } catch (cause) {
      lastError = { kind: "network", message: cause instanceof Error ? cause.message : String(cause) };
      await sleep(backoffDelay(attempt, retryOptions));
      continue;
    }

    if (!response.ok) {
      lastError = { kind: "http-status", status: response.status, url };
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
      return err({ kind: "invalid-json", url });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return err({
        kind: "schema-validation",
        url,
        issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`),
      });
    }

    return ok(parsed.data);
  }

  return err(lastError);
}
