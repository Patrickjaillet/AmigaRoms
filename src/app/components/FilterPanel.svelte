<script lang="ts">
  import { PLATFORMS } from "../../config/platforms.config.js";
  import type { SearchFilters, SortOption } from "../types/app.js";

  interface Props {
    filters: SearchFilters;
    onChange: (filters: SearchFilters) => void;
  }

  const { filters, onChange }: Props = $props();

  const allExtensions = $derived(
    Array.from(new Set(PLATFORMS.flatMap((p) => p.allowedExtensions))).sort(),
  );

  function togglePlatform(platformId: string): void {
    const platformIds = filters.platformIds.includes(platformId)
      ? filters.platformIds.filter((id) => id !== platformId)
      : [...filters.platformIds, platformId];
    onChange({ ...filters, platformIds });
  }

  function toggleExtension(extension: string): void {
    const extensions = filters.extensions.includes(extension)
      ? filters.extensions.filter((e) => e !== extension)
      : [...filters.extensions, extension];
    onChange({ ...filters, extensions });
  }

  function handleYearMinInput(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    onChange({ ...filters, yearMin: value === "" ? null : Number(value) });
  }

  function handleYearMaxInput(event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    onChange({ ...filters, yearMax: value === "" ? null : Number(value) });
  }

  function handleSortChange(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value as SortOption;
    onChange({ ...filters, sort: value });
  }
</script>

<aside class="filter-panel">
  <section>
    <h2>Platform</h2>
    <ul>
      {#each PLATFORMS as platform (platform.platformId)}
        <li>
          <label>
            <input
              type="checkbox"
              checked={filters.platformIds.includes(platform.platformId)}
              onchange={() => {
                togglePlatform(platform.platformId);
              }}
            />
            {platform.displayName}
          </label>
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>Year</h2>
    <div class="year-range">
      <input
        type="number"
        placeholder="From"
        value={filters.yearMin ?? ""}
        oninput={handleYearMinInput}
      />
      <input
        type="number"
        placeholder="To"
        value={filters.yearMax ?? ""}
        oninput={handleYearMaxInput}
      />
    </div>
  </section>

  <section>
    <h2>File extension</h2>
    <ul>
      {#each allExtensions as extension (extension)}
        <li>
          <label>
            <input
              type="checkbox"
              checked={filters.extensions.includes(extension)}
              onchange={() => {
                toggleExtension(extension);
              }}
            />
            .{extension}
          </label>
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>Sort</h2>
    <select value={filters.sort} onchange={handleSortChange}>
      <option value="title-asc">Title (A-Z)</option>
      <option value="year-desc">Year (newest)</option>
      <option value="year-asc">Year (oldest)</option>
      <option value="size-desc">File size (largest)</option>
      <option value="size-asc">File size (smallest)</option>
    </select>
  </section>
</aside>

<style>
  .filter-panel {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 12rem;
  }

  h2 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.6;
    margin: 0 0 0.5rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.9rem;
  }

  .year-range {
    display: flex;
    gap: 0.5rem;
  }

  .year-range input {
    width: 5rem;
  }

  select {
    width: 100%;
  }
</style>
