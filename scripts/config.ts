import { z } from "zod";
import { DEFAULT_RETRY_OPTIONS } from "../src/utils/http.js";
import type { RetryOptions } from "../src/utils/http.js";

const EnvSchema = z.object({
  REQUEST_DELAY_MS: z.coerce.number().int().nonnegative().default(250),
  MAX_CONCURRENT_REQUESTS: z.coerce.number().int().positive().max(20).default(4),
  ARCHIVE_ORG_BASE_URL: z.string().url().default("https://archive.org"),
  INDEXER_MAX_RETRIES: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(DEFAULT_RETRY_OPTIONS.maxRetries),
});

export interface IndexerConfig {
  readonly requestDelayMs: number;
  readonly maxConcurrentRequests: number;
  readonly archiveOrgBaseUrl: string;
  readonly retryOptions: RetryOptions;
}

function withoutEmptyValues(env: NodeJS.ProcessEnv): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

export function loadIndexerConfig(env: NodeJS.ProcessEnv = process.env): IndexerConfig {
  const parsed = EnvSchema.safeParse(withoutEmptyValues(env));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid indexer environment configuration: ${issues}`);
  }
  const { REQUEST_DELAY_MS, MAX_CONCURRENT_REQUESTS, ARCHIVE_ORG_BASE_URL, INDEXER_MAX_RETRIES } =
    parsed.data;
  return {
    requestDelayMs: REQUEST_DELAY_MS,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
    archiveOrgBaseUrl: ARCHIVE_ORG_BASE_URL,
    retryOptions: { ...DEFAULT_RETRY_OPTIONS, maxRetries: INDEXER_MAX_RETRIES },
  };
}
