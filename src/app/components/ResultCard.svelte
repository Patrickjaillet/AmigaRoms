<script lang="ts">
  import type { RomEntry } from "../../types/rom.js";
  import { getPlatformConfig } from "../../config/platforms.config.js";

  interface Props {
    entry: RomEntry;
  }

  const { entry }: Props = $props();

  const platformLabel = $derived(getPlatformConfig(entry.platform)?.displayName ?? entry.platform);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${String(bytes)} B`;
    const units = ["KB", "MB", "GB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex] ?? "KB"}`;
  }
</script>

<article class="result-card">
  <header>
    <span class="platform-badge">{platformLabel}</span>
    {#if entry.year !== null}
      <span class="year">{entry.year}</span>
    {/if}
  </header>
  <h3>{entry.title}</h3>
  <p class="file-meta">{entry.fileName} · {formatFileSize(entry.fileSizeBytes)}</p>
  <a class="download-button" href={entry.downloadUrl} rel="noopener noreferrer" target="_blank"
    >Download</a
  >
</article>

<style>
  .result-card {
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: light-dark(#ffffff, #1c1c1c);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .platform-badge {
    background: light-dark(#eef1f6, #2a2f3a);
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-weight: 600;
  }

  .year {
    opacity: 0.6;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  .file-meta {
    margin: 0;
    font-size: 0.8rem;
    opacity: 0.7;
    word-break: break-word;
  }

  .download-button {
    align-self: flex-start;
    margin-top: 0.25rem;
    padding: 0.4rem 0.9rem;
    border-radius: 0.375rem;
    background: #2563eb;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .download-button:hover {
    background: #1d4ed8;
  }
</style>
