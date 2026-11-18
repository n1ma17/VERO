<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  label: string
}>()
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-flex min-h-11 w-fit items-center gap-2 rounded-sm border border-text/30 px-4 py-2.5 text-sm font-semibold text-text transition hover:border-text"
  >
    <span aria-hidden="true">←</span>
    {{ label }}
  </RouterLink>
</template>
