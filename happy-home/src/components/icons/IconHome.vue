<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 22 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <g transform="translate(2 1.5) scale(0.75)">
      <path
        d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3z"
        stroke="currentColor"
        stroke-width="2.67"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</template>
