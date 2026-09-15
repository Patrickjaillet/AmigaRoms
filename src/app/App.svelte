<script lang="ts">
  import { PLATFORMS } from "../config/platforms.config.js";
  import type { RomEntry, SearchIndexManifest } from "../types/rom.js";
  import { loadManifestOrNull, loadPlatformCatalogWithCache } from "./data/cachedLoader.js";
  import { createSearchIndex, type RomSearchIndex } from "./search/index.js";
  import { debounce } from "./utils/debounce.js";
  import { DEFAULT_SEARCH_FILTERS, type LoadingState, type SearchFilters } from "./types/app.js";
  import FilterPanel from "./components/FilterPanel.svelte";
  import VirtualResultGrid from "./components/VirtualResultGrid.svelte";
  import ResultCardSkeleton from "./components/ResultCardSkeleton.svelte";
  import PwaStatus from "./components/PwaStatus.svelte";

  let filters = $state<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  let searchQuery = $state("");
  let loading = $state<LoadingState>({ kind: "idle" });
  let loadedPlatforms = $state<ReadonlySet<string>>(new Set());
  let searchIndex: RomSearchIndex = createSearchIndex();
  let allEntries = $state<readonly RomEntry[]>([]);
  let manifest = $state<SearchIndexManifest | null>(null);
  let manifestFetched = $state(false);

  const SKELETON_PLACEHOLDERS = Array.from({ length: 12 }, (_, index) => index);

  const targetPlatformIds = $derived(
    filters.platformIds.length > 0 ? filters.platformIds : PLATFORMS.map((p) => p.platformId),
  );

  $effect(() => {
    if (manifestFetched) {
      return;
    }
    manifestFetched = true;
    void loadManifestOrNull().then((result) => {
      manifest = result;
    });
  });

  $effect(() => {
    if (!manifestFetched) {
      return;
    }
    const toLoad = targetPlatformIds.filter((id) => !loadedPlatforms.has(id));
    if (toLoad.length === 0) {
      return;
    }
    loadedPlatforms = new Set([...loadedPlatforms, ...toLoad]);
    void loadPlatforms(toLoad);
  });

  async function loadPlatforms(platformIds: readonly string[]): Promise<void> {
    loading = { kind: "loading" };
    const newEntries: RomEntry[] = [];

    for (const platformId of platformIds) {
      const result = await loadPlatformCatalogWithCache(platformId, manifest);
      if (result.ok) {
        newEntries.push(...result.value.catalog.entries);
      }
    }

    searchIndex.addAll(newEntries);
    allEntries = [...allEntries, ...newEntries];
    loading = { kind: "loaded" };
  }

  const debouncedSetQuery = debounce((value: string) => {
    filters = { ...filters, query: value };
  }, 200);

  function handleSearchInput(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    searchQuery = value;
    debouncedSetQuery(value);
  }

  function sortEntries(
    entries: readonly RomEntry[],
    sort: SearchFilters["sort"],
  ): readonly RomEntry[] {
    const sorted = [...entries];
    switch (sort) {
      case "title-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "year-desc":
        return sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      case "year-asc":
        return sorted.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      case "size-desc":
        return sorted.sort((a, b) => b.fileSizeBytes - a.fileSizeBytes);
      case "size-asc":
        return sorted.sort((a, b) => a.fileSizeBytes - b.fileSizeBytes);
    }
  }

  const filteredResults = $derived.by(() => {
    const base = filters.query.trim().length > 0 ? searchIndex.search(filters.query) : allEntries;

    const filtered = base.filter((entry) => {
      if (filters.platformIds.length > 0 && !filters.platformIds.includes(entry.platform)) {
        return false;
      }
      if (filters.extensions.length > 0 && !filters.extensions.includes(entry.fileExtension)) {
        return false;
      }
      if (filters.yearMin !== null && (entry.year === null || entry.year < filters.yearMin)) {
        return false;
      }
      if (filters.yearMax !== null && (entry.year === null || entry.year > filters.yearMax)) {
        return false;
      }
      return true;
    });

    return sortEntries(filtered, filters.sort);
  });
</script>

<div class="layout">
  <PwaStatus />
  <header class="site-header">
    <h1>GamesRoms</h1>
    <div class="search-field">
      <label for="search-input" class="visually-hidden">Search titles, platforms, file names</label>
      <input
        id="search-input"
        class="search-input"
        type="search"
        placeholder="Search titles, platforms, file names…"
        value={searchQuery}
        oninput={handleSearchInput}
      />
    </div>
  </header>

  <div class="content">
    <FilterPanel
      {filters}
      onChange={(next) => {
        filters = next;
      }}
    />

    <main class="results">
      <p class="visually-hidden" role="status" aria-live="polite">
        {#if loading.kind === "loading" && allEntries.length === 0}
          Loading catalog…
        {:else}
          {filteredResults.length}
          {filteredResults.length === 1 ? "result" : "results"} found
        {/if}
      </p>
      {#if loading.kind === "loading" && allEntries.length === 0}
        <div class="results-grid">
          {#each SKELETON_PLACEHOLDERS as placeholder (placeholder)}
            <ResultCardSkeleton />
          {/each}
        </div>
      {:else if loading.kind === "error"}
        <p class="status error">{loading.message}</p>
      {:else if filteredResults.length === 0}
        <p class="status">No results found.</p>
      {:else}
        <VirtualResultGrid entries={filteredResults} />
      {/if}
    </main>
  </div>

  <footer class="site-footer">
    Copyright &copy; 2026 Patrick JAILLET — All rights reserved. |
    <a href="mailto:sandefjord.development@proton.me">sandefjord.development@proton.me</a> |
    <a href="https://patrickjaillet.github.io/GamesRoms">patrickjaillet.github.io/GamesRoms</a>
  </footer>
</div>

<style>
  :global(:root) {
    color-scheme: light dark;
  }

  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: light-dark(#f7f8fa, #121212);
    color: light-dark(#111111, #f0f0f0);
  }

  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .site-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid light-dark(#e0e0e0, #2a2a2a);
  }

  .site-header h1 {
    margin: 0;
    font-size: 1.25rem;
  }

  .search-field {
    flex: 1;
    min-width: 12rem;
  }

  .search-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    font-size: 0.9rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .content {
    flex: 1;
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    flex-wrap: wrap;
  }

  .results {
    flex: 1;
    min-width: 0;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1rem;
  }

  .status {
    opacity: 0.7;
  }

  .status.error {
    color: #dc2626;
  }

  .site-footer {
    padding: 0.75rem 1.5rem;
    font-size: 0.75rem;
    opacity: 0.6;
    text-align: center;
    border-top: 1px solid light-dark(#e0e0e0, #2a2a2a);
  }

  .site-footer a {
    color: inherit;
  }
</style>
