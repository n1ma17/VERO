<script setup lang="ts">
const emit = defineEmits<{
  continue: []
}>()
</script>

<template>
  <button
    type="button"
    class="grid size-16 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-[0_16px_40px_-12px] shadow-primary/45 transition hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
    aria-label="Continue to sign in"
    @click="emit('continue')"
  >
    <svg class="size-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
