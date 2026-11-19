<script setup lang="ts">
import { computed } from 'vue'

export type DigitState = 'default' | 'hidden' | 'error' | 'expired' | 'unavailable'

const props = withDefaults(defineProps<{ digit?: string; state?: DigitState }>(), {
  digit: '',
  state: 'default',
})

const shown = computed(() => {
  switch (props.state) {
    case 'hidden':
      return '*'
    case 'error':
    case 'unavailable':
      return '–'
    default:
      return props.digit
  }
})
</script>

<template>
  <div class="code-digit text-digit" :class="`code-digit--${state}`" :data-state="state">
    {{ shown }}
  </div>
</template>

<style scoped>
.code-digit {
  flex: 1 1 0;
  min-width: 0;
  max-width: 48px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-box-border);
  border-radius: 4px;
  background: var(--color-box);
  color: var(--color-text);
  user-select: none;
}

.code-digit--hidden,
.code-digit--unavailable {
  color: var(--color-icon-muted);
}

.code-digit--error {
  background: var(--color-error-bg);
  border-color: var(--color-error);
  color: color-mix(in srgb, var(--color-error) 60%, transparent);
}

.code-digit--expired {
  color: var(--color-text-muted);
  text-decoration: line-through;
}

@media (max-width: 599.98px) {
  .code-digit {
    max-width: 64px;
    height: 80px;
  }
}
</style>
