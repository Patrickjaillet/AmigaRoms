import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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

export interface CatalogDiff {
  readonly added: number;
  readonly updated: number;
  readonly removed: number;
}

function checksumOf(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function readPreviousCatalog(filePath: string): Promise<PlatformCatalog | null> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
  const parsed = PlatformCatalogSchema.safeParse(JSON.parse(raw) as unknown);
  return parsed.success ? parsed.data : null;
}

function diffCatalogEntries(previous: readonly RomEntry[], next: readonly RomEntry[]): CatalogDiff {
  const previousById = new Map(previous.map((entry) => [entry.id, entry]));
  const nextIds = new Set(next.map((entry) => entry.id));

  let added = 0;
  let updated = 0;
  for (const entry of next) {
    const previousEntry = previousById.get(entry.id);
    if (!previousEntry) {
      added += 1;
    } else if (
      previousEntry.md5 !== entry.md5 ||
      previousEntry.fileSizeBytes !== entry.fileSizeBytes
    ) {
      updated += 1;
    }
  }
  const removed = previous.filter((entry) => !nextIds.has(entry.id)).length;

  return { added, updated, removed };
}

export async function writePlatformCatalog(
  platformId: string,
  entries: readonly RomEntry[],
  dataDir: string,
  generatedAt: string,
): Promise<Result<{ manifestEntry: ManifestPlatformEntry; diff: CatalogDiff }, OutputError>> {
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
      issues: validation.error.issues.map(
        (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
    });
  }

  const fileName = `${platformId}.json`;
  const filePath = path.join(dataDir, fileName);
  const previous = await readPreviousCatalog(filePath);
  const diff = diffCatalogEntries(previous?.entries ?? [], entries);

  const serialized = `${JSON.stringify(validation.data, null, 2)}\n`;
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, serialized, "utf-8");

  return ok({
    manifestEntry: {
      platform: platformId,
      file: fileName,
      entryCount: entries.length,
      checksum: checksumOf(serialized),
      lastUpdated: generatedAt,
    },
    diff,
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
      issues: validation.error.issues.map(
        (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
      ),
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
