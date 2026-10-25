<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section
    class="rounded-3xl border border-primary/20 bg-surface p-5 text-text shadow-sm"
  >
    <h2 v-if="title" class="mb-4 text-base font-semibold">{{ title }}</h2>
    <slot />
  </section>
</template>
