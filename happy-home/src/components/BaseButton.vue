<script setup lang="ts">
import IconRetry from './icons/IconRetry.vue'
import IconSpinner from './icons/IconSpinner.vue'

withDefaults(defineProps<{ label: string; loading?: boolean; retryIcon?: boolean }>(), {
  loading: false,
  retryIcon: false,
})
</script>

<template>
  <button
    type="button"
    class="base-button text-button"
    :class="{ 'base-button--loading': loading }"
    :disabled="loading"
    :aria-busy="loading"
  >
    <template v-if="loading">
      <IconSpinner :size="14" />
      <span class="sr-only">Loading</span>
    </template>
    <template v-else>
      <IconRetry v-if="retryIcon" />
      <span>{{ label }}</span>
    </template>
  </button>
</template>

<style scoped>
.base-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  cursor: pointer;
}

.base-button--loading {
  background: var(--color-primary-disabled);
  cursor: progress;
}

@media (max-width: 599.98px) {
  .base-button {
    height: 44px;
  }
}
</style>
