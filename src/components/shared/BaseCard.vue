<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <section
    class="rounded-3xl border border-border-subtle/30 bg-surface p-5 text-content-on-surface shadow-sm"
  >
    <h2 v-if="title" class="mb-4 text-base font-semibold">{{ title }}</h2>
    <slot />
  </section>
</template>
