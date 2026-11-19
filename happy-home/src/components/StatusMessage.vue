<script setup lang="ts">
import { computed } from 'vue'
import IconAlert from './icons/IconAlert.vue'
import IconClock from './icons/IconClock.vue'
import IconServer from './icons/IconServer.vue'

export type StatusType = 'error' | 'warning' | 'server-error'

const props = defineProps<{ type: StatusType }>()

const content = computed(() => {
  switch (props.type) {
    case 'warning':
      return { icon: IconClock, text: 'This code has expired. Get a new code.', role: 'status' }
    case 'server-error':
      return { icon: IconServer, text: 'Server error (500). Try again later.', role: 'alert' }
    default:
      return { icon: IconAlert, text: 'Something went wrong. Please try again.', role: 'alert' }
  }
})
</script>

<template>
  <p class="status-message text-message" :class="`status-message--${type}`" :role="content.role">
    <component :is="content.icon" class="status-message__icon" />
    <span>{{ content.text }}</span>
  </p>
</template>

<style scoped>
.status-message {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: var(--color-error);
}

.status-message--warning {
  color: var(--color-warning);
}

.status-message__icon {
  flex: none;
}
</style>
