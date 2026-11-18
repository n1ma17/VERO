<script setup lang="ts">
withDefaults(
  defineProps<{
    showLabel?: boolean
  }>(),
  { showLabel: true },
)
</script>

<template>
  <span class="inline-flex shrink-0 items-center gap-1.5 text-background" aria-hidden="true">
    <span
      class="grid size-8 place-items-center rounded-sm border border-background/45 bg-background/12"
    >
      <svg class="size-3.5" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 12 6 4 9 9 11 6 13 12"
          stroke="var(--color-accent)"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="showLabel" class="text-sm font-semibold tracking-wide">money</span>
  </span>
</template>