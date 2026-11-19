<script setup lang="ts">
import IconHome from './icons/IconHome.vue'
</script>

<template>
  <div class="app-logo text-brand">
    <IconHome :size="22" />
    <span>Happy home</span>
  </div>
</template>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-on-bg);
}
</style>
