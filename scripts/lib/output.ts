import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  PlatformCatalogSchema,
  SearchIndexManifestSchema,
  CURRENT_SCHEMA_VERSION,
  type PlatformCatalog,
  type ManifestPlatformEntry,
  type RomEntry,
} from "../../src/types/rom.js";
import { ok, err, type Result } from "../../src/utils/result.js";

export interface OutputError {
  readonly platform: string;
  readonly issues: readonly string[];
}

function checksumOf(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function writePlatformCatalog(
  platformId: string,
  entries: readonly RomEntry[],
  dataDir: string,
  generatedAt: string,
): Promise<Result<ManifestPlatformEntry, OutputError>> {
  const catalog: PlatformCatalog = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    platform: platformId,
    totalEntries: entries.length,
    lastUpdated: generatedAt,
    entries: [...entries],
  };

  const validation = PlatformCatalogSchema.safeParse(catalog);
  if (!validation.success) {
    return err({
      platform: platformId,
      issues: validation.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`),
    });
  }

  const fileName = `${platformId}.json`;
  const serialized = `${JSON.stringify(validation.data, null, 2)}\n`;
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, fileName), serialized, "utf-8");

  return ok({
    platform: platformId,
    file: fileName,
    entryCount: entries.length,
    checksum: checksumOf(serialized),
    lastUpdated: generatedAt,
  });
}

export async function writeManifest(
  platformEntries: readonly ManifestPlatformEntry[],
  dataDir: string,
  generatedAt: string,
): Promise<Result<void, OutputError>> {
  const manifest = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    generatedAt,
    platforms: [...platformEntries],
  };

  const validation = SearchIndexManifestSchema.safeParse(manifest);
  if (!validation.success) {
    return err({
      platform: "<manifest>",
      issues: validation.error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`),
    });
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "manifest.json"),
    `${JSON.stringify(validation.data, null, 2)}\n`,
    "utf-8",
  );
  return ok(undefined);
}
