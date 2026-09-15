<script lang="ts">
  import { createVirtualizer } from "@tanstack/svelte-virtual";
  import type { RomEntry } from "../../types/rom.js";
  import ResultCard from "./ResultCard.svelte";

  interface Props {
    entries: readonly RomEntry[];
  }

  const { entries }: Props = $props();

  const CARD_MIN_WIDTH = 256;
  const CARD_GAP = 16;
  const ROW_HEIGHT_ESTIMATE = 168;

  let scrollElement = $state<HTMLDivElement | null>(null);
  let containerWidth = $state(0);

  const columnCount = $derived(
    Math.max(1, Math.floor((containerWidth + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP))),
  );
  const rowCount = $derived(Math.ceil(entries.length / columnCount));

  const rowVirtualizer = $derived(
    createVirtualizer({
      count: rowCount,
      getScrollElement: () => scrollElement,
      estimateSize: () => ROW_HEIGHT_ESTIMATE,
      overscan: 4,
    }),
  );

  function rowEntries(rowIndex: number): readonly RomEntry[] {
    const start = rowIndex * columnCount;
    return entries.slice(start, start + columnCount);
  }
</script>

<div class="virtual-scroll" bind:this={scrollElement} bind:clientWidth={containerWidth}>
  <div class="virtual-inner" style:height="{$rowVirtualizer.getTotalSize()}px">
    {#each $rowVirtualizer.getVirtualItems() as virtualRow (virtualRow.key)}
      <div
        class="virtual-row"
        style:transform="translateY({virtualRow.start}px)"
        style:grid-template-columns="repeat({columnCount}, minmax({CARD_MIN_WIDTH}px, 1fr))"
      >
        {#each rowEntries(virtualRow.index) as entry (entry.id)}
          <ResultCard {entry} />
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .virtual-scroll {
    height: 75vh;
    overflow-y: auto;
  }

  .virtual-inner {
    position: relative;
    width: 100%;
  }

  .virtual-row {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    display: grid;
    gap: 1rem;
    padding-bottom: 1rem;
  }
</style>
