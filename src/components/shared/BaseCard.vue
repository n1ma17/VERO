<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section class="rounded-2xl border border-border bg-surface p-5 shadow-sm">
    <h2 v-if="title" class="mb-4 text-base font-semibold">{{ title }}</h2>
    <slot />
  </section>
</template>
