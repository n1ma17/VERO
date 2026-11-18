<script setup lang="ts">
defineProps<{
  kind: string
  meta: string
}>()
</script>

<template>
  <header class="text-center">
    <svg class="mx-auto size-6" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 12 6 4 9 9 11 6 13 12"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
    </svg>
    <p class="mt-3 pl-[0.6em] text-xl font-bold tracking-[0.6em] text-primary">MONEY</p>
    <p class="mt-4 text-[11px] font-medium uppercase tracking-[0.2em]">{{ kind }}</p>
    <p class="mt-0.5 text-[10px] uppercase tracking-[0.12em]">{{ meta }}</p>
  </header>
</template>
