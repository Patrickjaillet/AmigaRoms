import { z } from "zod";

export const ArchiveOrgSearchDocSchema = z.object({
  identifier: z.string(),
  title: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  downloads: z.number().optional(),
  mediatype: z.string().optional(),
  collection: z.union([z.string(), z.array(z.string())]).optional(),
});

export type ArchiveOrgSearchDoc = z.infer<typeof ArchiveOrgSearchDocSchema>;

export const ArchiveOrgSearchResponseSchema = z.object({
  responseHeader: z.object({
    status: z.number(),
    QTime: z.number(),
  }),
  response: z.object({
    numFound: z.number(),
    start: z.number(),
    docs: z.array(ArchiveOrgSearchDocSchema),
  }),
});

export type ArchiveOrgSearchResponse = z.infer<typeof ArchiveOrgSearchResponseSchema>;

export const ArchiveOrgFileSchema = z.object({
  name: z.string(),
  source: z.string().optional(),
  format: z.string().optional(),
  size: z.string().optional(),
  md5: z.string().optional(),
  crc32: z.string().optional(),
  sha1: z.string().optional(),
  mtime: z.string().optional(),
});

export type ArchiveOrgFile = z.infer<typeof ArchiveOrgFileSchema>;

export const ArchiveOrgItemMetadataFieldsSchema = z.object({
  identifier: z.string(),
  title: z.string().optional(),
  date: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  collection: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  mediatype: z.string().optional(),
});

export const ArchiveOrgItemMetadataSchema = z.object({
  server: z.string(),
  dir: z.string(),
  files: z.array(ArchiveOrgFileSchema),
  metadata: ArchiveOrgItemMetadataFieldsSchema,
  files_count: z.number().optional(),
  item_size: z.number().optional(),
});

export type ArchiveOrgItemMetadata = z.infer<typeof ArchiveOrgItemMetadataSchema>;

export type ValidationResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly issues: readonly string[] };

export function validateArchiveOrgResponse<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    issues: result.error.issues.map(
      (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`,
    ),
  };
}
