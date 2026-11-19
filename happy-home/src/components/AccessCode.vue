<script setup lang="ts">
import { computed } from 'vue'
import CodeDigit, { type DigitState } from './CodeDigit.vue'

const props = withDefaults(defineProps<{ code?: string | null; state?: DigitState }>(), {
  code: null,
  state: 'default',
})

const digits = computed(() => {
  const chars = (props.code ?? '').split('')
  return Array.from({ length: 4 }, (_, i) => chars[i] ?? '')
})

/** The four boxes are one value for assistive technology. */
const label = computed(() => {
  const spaced = digits.value.join(' ')
  switch (props.state) {
    case 'hidden':
      return 'Loading access code'
    case 'expired':
      return `Expired access code ${spaced}`
    case 'error':
    case 'unavailable':
      return 'Access code unavailable'
    default:
      return `Access code ${spaced}`
  }
})
</script>

<template>
  <div class="access-code" role="img" :aria-label="label">
    <CodeDigit
      v-for="(digit, i) in digits"
      :key="i"
      :digit="digit"
      :state="state"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.access-code {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}
</style>
