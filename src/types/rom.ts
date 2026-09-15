import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 1;

export const RomEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  platform: z.string(),
  year: z.number().int().nullable(),
  collection: z.string(),
  fileName: z.string(),
  fileExtension: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
  downloadUrl: z.string().url(),
  archiveIdentifier: z.string(),
  md5: z.string().nullable(),
  indexedAt: z.string().datetime(),
});

export type RomEntry = z.infer<typeof RomEntrySchema>;

export const PlatformCatalogSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  platform: z.string(),
  totalEntries: z.number().int().nonnegative(),
  lastUpdated: z.string().datetime(),
  entries: z.array(RomEntrySchema),
});

export type PlatformCatalog = z.infer<typeof PlatformCatalogSchema>;

export const ManifestPlatformEntrySchema = z.object({
  platform: z.string(),
  file: z.string(),
  entryCount: z.number().int().nonnegative(),
  checksum: z.string(),
  lastUpdated: z.string().datetime(),
});

export type ManifestPlatformEntry = z.infer<typeof ManifestPlatformEntrySchema>;

export const SearchIndexManifestSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  generatedAt: z.string().datetime(),
  platforms: z.array(ManifestPlatformEntrySchema),
});

export type SearchIndexManifest = z.infer<typeof SearchIndexManifestSchema>;

export interface IndexingReport {
  readonly platform: string;
  readonly discoveredIdentifiers: number;
  readonly entriesWritten: number;
  readonly entriesSkipped: number;
  readonly errors: readonly IndexingError[];
  readonly durationMs: number;
}

export interface IndexingError {
  readonly identifier: string;
  readonly reason: string;
}
