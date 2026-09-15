<script lang="ts">
  import type { RomEntry } from "../../types/rom.js";

  interface Props {
    entry: RomEntry;
    onClose: () => void;
  }

  const { entry, onClose }: Props = $props();

  let copiedField = $state<"link" | "md5" | null>(null);
  let dialogElement = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    dialogElement?.showModal();
  });

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

  async function copyToClipboard(text: string, field: "link" | "md5"): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      copiedField = field;
      setTimeout(() => {
        copiedField = null;
      }, 1500);
    } catch {
      copiedField = null;
    }
  }

  function handleClose(): void {
    dialogElement?.close();
    onClose();
  }
</script>

<dialog
  bind:this={dialogElement}
  class="download-dialog"
  onclose={onClose}
  onclick={(event) => {
    if (event.target === dialogElement) handleClose();
  }}
>
  <h2>{entry.title}</h2>

  <dl class="details">
    <dt>File</dt>
    <dd>{entry.fileName}</dd>
    <dt>Size</dt>
    <dd>{formatFileSize(entry.fileSizeBytes)}</dd>
    <dt>MD5</dt>
    <dd class="checksum">
      {#if entry.md5}
        <code>{entry.md5}</code>
        <button
          type="button"
          class="copy-button"
          onclick={() => {
            void copyToClipboard(entry.md5 ?? "", "md5");
          }}
        >
          {copiedField === "md5" ? "Copied!" : "Copy"}
        </button>
      {:else}
        <span class="unavailable">Not available</span>
      {/if}
    </dd>
  </dl>

  <div class="link-row">
    <input class="link-input" type="text" readonly value={entry.downloadUrl} />
    <button
      type="button"
      class="copy-button"
      onclick={() => {
        void copyToClipboard(entry.downloadUrl, "link");
      }}
    >
      {copiedField === "link" ? "Copied!" : "Copy link"}
    </button>
  </div>

  <div class="actions">
    <button type="button" class="secondary-button" onclick={handleClose}>Cancel</button>
    <a
      class="primary-button"
      href={entry.downloadUrl}
      rel="noopener noreferrer"
      target="_blank"
      onclick={handleClose}
    >
      Download
    </a>
  </div>
</dialog>

<style>
  .download-dialog {
    border: none;
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 28rem;
    width: calc(100vw - 2rem);
    background: light-dark(#ffffff, #1c1c1c);
    color: inherit;
  }

  .download-dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.1rem;
  }

  .details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4rem 0.75rem;
    margin: 0 0 1rem;
    font-size: 0.85rem;
  }

  .details dt {
    opacity: 0.6;
  }

  .details dd {
    margin: 0;
  }

  .checksum {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .checksum code {
    font-size: 0.75rem;
    word-break: break-all;
  }

  .unavailable {
    opacity: 0.5;
  }

  .link-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .link-input {
    flex: 1;
    min-width: 0;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    background: light-dark(#f7f8fa, #121212);
    color: inherit;
    font-size: 0.8rem;
  }

  .copy-button {
    flex-shrink: 0;
    padding: 0.4rem 0.7rem;
    border-radius: 0.375rem;
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    background: light-dark(#f7f8fa, #1f1f1f);
    color: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .secondary-button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    background: transparent;
    color: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .primary-button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    background: #2563eb;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .primary-button:hover {
    background: #1d4ed8;
  }
</style>
