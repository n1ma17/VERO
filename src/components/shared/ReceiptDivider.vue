<script setup lang="ts">
withDefaults(
  defineProps<{
    /** How far notches sit outside the receipt edge (Tailwind spacing scale). */
    inset?: 3 | 8
  }>(),
  { inset: 3 },
)

const notchClasses = {
  3: { left: '-left-3', right: '-right-3' },
  8: { left: '-left-8', right: '-right-8' },
} as const
</script>

<template>
  <div class="relative z-10 bg-surface py-1.5" aria-hidden="true">
    <span
      class="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-background"
      :class="notchClasses[inset].left"
    />
    <span
      class="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-background"
      :class="notchClasses[inset].right"
    />
    <div class="w-full border-t-2 border-dashed border-text-muted/30" />
  </div>
</template>
