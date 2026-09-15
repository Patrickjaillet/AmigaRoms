#!/usr/bin/env tsx
import process from "node:process";
import {
  PLATFORMS,
  validatePlatformsConfig,
  type PlatformConfig,
} from "../src/config/platforms.config.js";
import type { IndexingError, IndexingReport, RomEntry } from "../src/types/rom.js";
import { createLimiter } from "../src/utils/concurrency.js";
import type { RetryOptions } from "../src/utils/http.js";
import { loadIndexerConfig } from "./config.js";
import { parseCliArgs } from "./lib/cli.js";
import { discoverItems } from "./lib/discover.js";
import { fetchItemMetadata } from "./lib/metadata.js";
import { deduplicateAndSort, itemMetadataToRomEntries } from "./lib/transform.js";
import { writeManifest, writePlatformCatalog } from "./lib/output.js";
import type { ManifestPlatformEntry } from "../src/types/rom.js";

const DATA_DIR = new URL("../data", import.meta.url).pathname;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function indexPlatform(
  platform: PlatformConfig,
  deps: {
    baseUrl: string;
    requestDelayMs: number;
    limiter: ReturnType<typeof createLimiter>;
    retryOptions: RetryOptions;
    dryRun: boolean;
  },
  generatedAt: string,
): Promise<{ report: IndexingReport; manifestEntry: ManifestPlatformEntry | null }> {
  const startedAt = Date.now();
  const errors: IndexingError[] = [];

  const discovery = await discoverItems(platform, {
    baseUrl: deps.baseUrl,
    limiter: deps.limiter,
    retryOptions: deps.retryOptions,
  });
  if (!discovery.ok) {
    for (const discoveryError of discovery.error) {
      errors.push({
        identifier: discoveryError.collection,
        reason: `discovery page ${String(discoveryError.page)} failed: ${discoveryError.cause.kind}`,
      });
    }
    return {
      report: {
        platform: platform.platformId,
        discoveredIdentifiers: 0,
        entriesWritten: 0,
        entriesSkipped: 0,
        errors,
        durationMs: Date.now() - startedAt,
      },
      manifestEntry: null,
    };
  }

  const identifiers = discovery.value;
  const allEntries: RomEntry[] = [];

  for (const identifier of identifiers) {
    const metadataResult = await fetchItemMetadata(identifier, {
      baseUrl: deps.baseUrl,
      limiter: deps.limiter,
      retryOptions: deps.retryOptions,
    });
    await sleep(deps.requestDelayMs);

    if (!metadataResult.ok) {
      errors.push({ identifier, reason: `metadata fetch failed: ${metadataResult.error.kind}` });
      continue;
    }

    const entries = itemMetadataToRomEntries(metadataResult.value, platform, generatedAt);
    allEntries.push(...entries);
  }

  const finalEntries = deduplicateAndSort(allEntries);

  if (deps.dryRun) {
    return {
      report: {
        platform: platform.platformId,
        discoveredIdentifiers: identifiers.length,
        entriesWritten: finalEntries.length,
        entriesSkipped: allEntries.length - finalEntries.length,
        errors,
        durationMs: Date.now() - startedAt,
      },
      manifestEntry: null,
    };
  }

  const writeResult = await writePlatformCatalog(
    platform.platformId,
    finalEntries,
    DATA_DIR,
    generatedAt,
  );

  if (!writeResult.ok) {
    console.error(
      `[${platform.platformId}] catalog failed schema validation:`,
      writeResult.error.issues,
    );
    process.exitCode = 1;
    return {
      report: {
        platform: platform.platformId,
        discoveredIdentifiers: identifiers.length,
        entriesWritten: 0,
        entriesSkipped: allEntries.length,
        errors,
        durationMs: Date.now() - startedAt,
      },
      manifestEntry: null,
    };
  }

  return {
    report: {
      platform: platform.platformId,
      discoveredIdentifiers: identifiers.length,
      entriesWritten: finalEntries.length,
      entriesSkipped: allEntries.length - finalEntries.length,
      errors,
      durationMs: Date.now() - startedAt,
    },
    manifestEntry: writeResult.value,
  };
}

async function main(): Promise<void> {
  const cli = parseCliArgs(process.argv.slice(2));
  validatePlatformsConfig();
  const config = loadIndexerConfig();
  const limiter = createLimiter(config.maxConcurrentRequests);
  const generatedAt = new Date().toISOString();

  const targetPlatforms = cli.platform
    ? PLATFORMS.filter((platform) => platform.platformId === cli.platform)
    : PLATFORMS;

  if (targetPlatforms.length === 0) {
    console.error(
      `Unknown platform "${cli.platform ?? ""}". Known platforms: ${PLATFORMS.map((p) => p.platformId).join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const manifestEntries: ManifestPlatformEntry[] = [];

  for (const platform of targetPlatforms) {
    console.info(`[${platform.platformId}] indexing (dry-run: ${String(cli.dryRun)})...`);
    const { report, manifestEntry } = await indexPlatform(
      platform,
      {
        baseUrl: config.archiveOrgBaseUrl,
        requestDelayMs: config.requestDelayMs,
        limiter,
        retryOptions: config.retryOptions,
        dryRun: cli.dryRun,
      },
      generatedAt,
    );
    console.info(
      `[${platform.platformId}] discovered=${String(report.discoveredIdentifiers)} written=${String(report.entriesWritten)} skipped=${String(report.entriesSkipped)} errors=${String(report.errors.length)} duration=${String(report.durationMs)}ms`,
    );
    if (manifestEntry) {
      manifestEntries.push(manifestEntry);
    }
  }

  if (!cli.dryRun && manifestEntries.length > 0) {
    const manifestResult = await writeManifest(manifestEntries, DATA_DIR, generatedAt);
    if (!manifestResult.ok) {
      console.error("manifest.json failed schema validation:", manifestResult.error.issues);
      process.exitCode = 1;
    }
  }
}

main().catch((error: unknown) => {
  console.error("Indexer crashed:", error);
  process.exitCode = 1;
});
