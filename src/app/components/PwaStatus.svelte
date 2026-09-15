<script lang="ts">
  import { useRegisterSW } from "virtual:pwa-register/svelte";

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();

  let isOnline = $state(navigator.onLine);

  function handleOnline(): void {
    isOnline = true;
  }
  function handleOffline(): void {
    isOnline = false;
  }

  $effect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

  function dismissOfflineReady(): void {
    offlineReady.set(false);
  }
</script>

{#if !isOnline}
  <div class="banner offline" role="status">You are offline. Showing cached catalog data.</div>
{/if}

{#if $needRefresh}
  <div class="banner update" role="status">
    <span>A new version is available.</span>
    <button
      type="button"
      onclick={() => {
        void updateServiceWorker(true);
      }}
    >
      Reload
    </button>
  </div>
{:else if $offlineReady}
  <div class="banner ready" role="status">
    <span>AmigaRoms is ready to work offline.</span>
    <button type="button" onclick={dismissOfflineReady}>Dismiss</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    text-align: center;
  }

  .offline {
    background: light-dark(#fef3c7, #453a14);
    color: light-dark(#78350f, #fbbf24);
  }

  .update {
    background: light-dark(#dbeafe, #1e3a5f);
    color: light-dark(#1e40af, #93c5fd);
  }

  .ready {
    background: light-dark(#dcfce7, #14371f);
    color: light-dark(#166534, #86efac);
  }

  .banner button {
    padding: 0.25rem 0.6rem;
    border-radius: 0.25rem;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
</style>
