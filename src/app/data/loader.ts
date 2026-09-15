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

function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`;
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
): Promise<Result<T, DataLoadError>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    return err({
      kind: "network",
      message: cause instanceof Error ? cause.message : String(cause),
    });
  }

  if (!response.ok) {
    return err({ kind: "http-status", status: response.status });
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

export async function loadManifest(): Promise<Result<SearchIndexManifest, DataLoadError>> {
  return fetchAndValidate(dataUrl("manifest.json"), SearchIndexManifestSchema);
}

export async function loadPlatformCatalog(
  platform: string,
): Promise<Result<PlatformCatalog, DataLoadError>> {
  return fetchAndValidate(dataUrl(`${platform}.json`), PlatformCatalogSchema);
}
