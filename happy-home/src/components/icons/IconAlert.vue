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
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" />
    <path d="M12 7v6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="12" cy="17" r="1.4" fill="currentColor" />
  </svg>
</template>
