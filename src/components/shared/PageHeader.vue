<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
    <p v-if="subtitle" class="mt-1 text-sm text-content-muted">{{ subtitle }}</p>
  </div>
</template>
