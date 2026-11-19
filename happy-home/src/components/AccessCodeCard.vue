<script setup lang="ts">
import { computed } from 'vue'
import type { AccessCodeState } from '@/composables/useAccessCode'
import AccessCode from './AccessCode.vue'
import BaseButton from './BaseButton.vue'
import IconClose from './icons/IconClose.vue'
import StatusMessage, { type StatusType } from './StatusMessage.vue'
import type { DigitState } from './CodeDigit.vue'

const props = defineProps<{ state: AccessCodeState }>()
const emit = defineEmits<{ close: []; regenerate: []; retry: [] }>()

interface View {
  digitState: DigitState
  code: string | null
  message: StatusType | null
  loading: boolean
  label: string
  retryIcon: boolean
}

/** Maps the behavior state to the Figma component states. */
const view = computed<View>(() => {
  const s = props.state
  if (s.status === 'loading') {
    return {
      digitState: 'hidden',
      code: null,
      message: null,
      loading: true,
      label: 'Get new code',
      retryIcon: false,
    }
  }
  if (s.status === 'ready') {
    return {
      digitState: 'default',
      code: s.code,
      message: null,
      loading: false,
      label: 'Get new code',
      retryIcon: false,
    }
  }
  if (s.status === 'expired') {
    return {
      digitState: 'expired',
      code: s.code,
      message: 'warning',
      loading: false,
      label: 'Get new code',
      retryIcon: false,
    }
  }
  const server = s.kind === 'server'
  return {
    digitState: server ? 'unavailable' : 'error',
    code: null,
    message: server ? 'server-error' : 'error',
    loading: false,
    label: 'Try again',
    retryIcon: true,
  }
})

function onAction() {
  if (props.state.status === 'error') emit('retry')
  else emit('regenerate')
}
</script>

<template>
  <section class="card" aria-labelledby="access-code-title">
    <header class="card__header">
      <h1 id="access-code-title" class="card__title text-title">Your access code:</h1>
      <button type="button" class="card__close" aria-label="Close" @click="emit('close')">
        <IconClose />
      </button>
    </header>

    <AccessCode class="card__code" :code="view.code" :state="view.digitState" />

    <div class="card__message">
      <StatusMessage v-if="view.message" :type="view.message" />
    </div>

    <BaseButton
      class="card__button"
      :label="view.label"
      :loading="view.loading"
      :retry-icon="view.retryIcon"
      @click="onAction"
    />

    <p class="card__caption text-caption">
      Your access code is unique for your apartment. If you generate a new code, the
      <strong>old code can not be used anymore</strong>.
    </p>
  </section>
</template>

<style scoped>
.card {
  width: 288px;
  /* 2px border + padding = the 22px / 24px insets of the Figma card */
  padding: 22px 20px 25px;
  border: 2px solid var(--color-surface-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card__title {
  margin: 0;
}

.card__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: -12px -6px -12px 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: none;
  color: var(--color-icon-muted);
  cursor: pointer;
}

.card__code {
  margin-top: 28px;
}

.card__message {
  min-height: 12px;
  margin-top: 10px;
}

.card__button {
  margin-top: 9px;
}

.card__caption {
  margin: 12px 0 0;
  color: var(--color-text-muted);
}

.card__caption strong {
  font-weight: 700;
}

@media (max-width: 599.98px) {
  .card {
    width: calc(100% - 48px);
  }

  .card__close {
    width: 44px;
    height: 44px;
    margin: -13px -15px -13px 0;
  }

  .card__close :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .card__code {
    margin-top: 22px;
  }

  .card__message {
    min-height: 14px;
    margin-top: 16px;
  }

  .card__button {
    margin-top: 12px;
  }
}
</style>
