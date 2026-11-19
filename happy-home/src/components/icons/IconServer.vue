<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 12 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="3" y="3" width="18" height="7" rx="2" stroke="currentColor" stroke-width="2.5" />
    <rect x="3" y="14" width="18" height="7" rx="2" stroke="currentColor" stroke-width="2.5" />
    <path d="M7 6.5h.01M7 17.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>
