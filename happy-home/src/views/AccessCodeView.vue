<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAccessCode } from '@/composables/useAccessCode'
import AccessCodeCard from '@/components/AccessCodeCard.vue'
import AppLogo from '@/components/AppLogo.vue'

const { state, announcement, load, regenerate, retry } = useAccessCode()
const open = ref(true)

onMounted(load)
</script>

<template>
  <main v-if="open" class="access-code-view">
    <AppLogo />
    <AccessCodeCard :state="state" @close="open = false" @regenerate="regenerate" @retry="retry" />
    <div class="sr-only" role="status" aria-live="polite">{{ announcement }}</div>
  </main>
</template>

<style scoped>
.access-code-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 23px;
  min-height: 100vh;
  padding: 24px 0 65px;
}
</style>
