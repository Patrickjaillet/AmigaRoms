<script lang="ts"></script>

<article class="skeleton-card" aria-hidden="true">
  <div class="skeleton-line skeleton-badge"></div>
  <div class="skeleton-line skeleton-title"></div>
  <div class="skeleton-line skeleton-meta"></div>
  <div class="skeleton-line skeleton-button"></div>
</article>

<style>
  .skeleton-card {
    border: 1px solid light-dark(#d8d8d8, #3a3a3a);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: light-dark(#ffffff, #1c1c1c);
  }

  .skeleton-line {
    border-radius: 0.25rem;
    background: light-dark(#e8e8e8, #2a2a2a);
    animation: pulse 1.4s ease-in-out infinite;
  }

  .skeleton-badge {
    width: 40%;
    height: 0.9rem;
  }

  .skeleton-title {
    width: 80%;
    height: 1.1rem;
  }

  .skeleton-meta {
    width: 60%;
    height: 0.8rem;
  }

  .skeleton-button {
    width: 5rem;
    height: 1.8rem;
    margin-top: 0.25rem;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
