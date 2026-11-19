<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 12 })
</script>

<template>
  <svg
    class="icon-spinner"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.icon-spinner {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-spinner {
    animation-duration: 3s;
  }
}
</style>
