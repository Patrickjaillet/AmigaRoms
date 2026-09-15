import type { PlatformCatalog, RomEntry } from "../../types/rom.js";

export type SortOption = "title-asc" | "year-desc" | "year-asc" | "size-desc" | "size-asc";

export interface SearchFilters {
  readonly query: string;
  readonly platformIds: readonly string[];
  readonly yearMin: number | null;
  readonly yearMax: number | null;
  readonly extensions: readonly string[];
  readonly sort: SortOption;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: "",
  platformIds: [],
  yearMin: null,
  yearMax: null,
  extensions: [],
  sort: "title-asc",
};

export type LoadingState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "loaded" }
  | { readonly kind: "error"; readonly message: string };

export interface AppState {
  readonly loading: LoadingState;
  readonly catalogsByPlatform: ReadonlyMap<string, PlatformCatalog>;
  readonly filters: SearchFilters;
  readonly results: readonly RomEntry[];
}
