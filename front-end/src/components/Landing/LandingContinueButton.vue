<script setup lang="ts">
const emit = defineEmits<{
  continue: []
}>()
</script>

<template>
  <button
    type="button"
    class="group flex min-h-14 items-center justify-between gap-4 rounded-sm bg-accent px-5 text-base font-semibold text-on-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    @click="emit('continue')"
  >
    Open your ledger
    <svg
      class="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
    </svg>
  </button>
</template>
