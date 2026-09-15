import type { ArchiveOrgItemMetadata, ArchiveOrgFile } from "../../src/types/archive-org.js";
import type { PlatformConfig } from "../../src/config/platforms.config.js";
import type { RomEntry } from "../../src/types/rom.js";
import { buildRomEntryId } from "../../src/utils/id.js";

function extractFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex + 1).toLowerCase();
}

function normalizeYear(metadata: ArchiveOrgItemMetadata["metadata"]): number | null {
  const rawYear = metadata.year;
  if (rawYear !== undefined) {
    const parsed = typeof rawYear === "number" ? rawYear : Number.parseInt(rawYear, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (metadata.date) {
    const match = /(\d{4})/.exec(metadata.date);
    if (match?.[1]) {
      return Number.parseInt(match[1], 10);
    }
  }
  return null;
}

function normalizeCollection(metadata: ArchiveOrgItemMetadata["metadata"], fallback: string): string {
  if (Array.isArray(metadata.collection)) {
    return metadata.collection[0] ?? fallback;
  }
  return metadata.collection ?? fallback;
}

function buildDownloadUrl(server: string, dir: string, fileName: string): string {
  const encodedPath = dir
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `https://${server}/${encodedPath}/${encodeURIComponent(fileName)}`;
}

function isAllowedFile(file: ArchiveOrgFile, platform: PlatformConfig): boolean {
  const extension = extractFileExtension(file.name);
  return extension.length > 0 && platform.allowedExtensions.includes(extension);
}

export function itemMetadataToRomEntries(
  metadata: ArchiveOrgItemMetadata,
  platform: PlatformConfig,
  indexedAt: string,
): readonly RomEntry[] {
  const identifier = metadata.metadata.identifier;
  const title = metadata.metadata.title ?? identifier;
  const year = normalizeYear(metadata.metadata);
  const collection = normalizeCollection(metadata.metadata, platform.platformId);

  return metadata.files
    .filter((file) => isAllowedFile(file, platform))
    .map((file): RomEntry => {
      const fileSizeBytes = file.size ? Number.parseInt(file.size, 10) : 0;
      return {
        id: buildRomEntryId(identifier, file.name),
        title,
        platform: platform.platformId,
        year,
        collection,
        fileName: file.name,
        fileExtension: extractFileExtension(file.name),
        fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : 0,
        downloadUrl: buildDownloadUrl(metadata.server, metadata.dir, file.name),
        archiveIdentifier: identifier,
        md5: file.md5 ?? null,
        indexedAt,
      };
    });
}

export function deduplicateAndSort(entries: readonly RomEntry[]): readonly RomEntry[] {
  const seenMd5 = new Set<string>();
  const deduplicated: RomEntry[] = [];

  for (const entry of entries) {
    if (entry.md5 !== null) {
      if (seenMd5.has(entry.md5)) {
        continue;
      }
      seenMd5.add(entry.md5);
    }
    deduplicated.push(entry);
  }

  return [...deduplicated].sort((a, b) => a.title.localeCompare(b.title));
}
