<script setup lang="ts">
defineProps<{
  code: string
}>()

const barClasses = ['w-px', 'w-0.5', 'w-1', 'w-px', 'w-0.5', 'w-px', 'w-1', 'w-0.5']
const pattern = Array.from({ length: 40 }, (_, index) => barClasses[(index * 5 + 3) % barClasses.length])
</script>

<template>
  <div aria-hidden="true">
    <div class="flex h-12 items-stretch justify-center gap-0.5">
      <span v-for="(bar, index) in pattern" :key="index" class="bg-text" :class="bar" />
    </div>
    <p class="mt-2 text-center font-mono text-xs tracking-[0.4em] text-text-muted">
      {{ code }}
    </p>
  </div>
</template>
