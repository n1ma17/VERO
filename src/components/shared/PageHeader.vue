<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="mb-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-bold text-text sm:text-2xl">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-text-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="w-full shrink-0 sm:w-auto sm:pt-1">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
