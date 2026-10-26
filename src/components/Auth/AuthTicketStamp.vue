<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tone: 'success' | 'rejected'
}>()

const copy = {
  success: { title: 'Success', subtitle: 'Admitted' },
  rejected: { title: 'Rejected', subtitle: 'Denied' },
} as const

const toneClasses = {
  success: 'border-success text-success',
  rejected: 'border-danger text-danger',
} as const

const label = computed(() => copy[props.tone])
</script>

<template>
  <div
    class="pointer-events-none select-none rounded-xl border-4 border-double px-5 py-2 text-center font-mono opacity-85"
    :class="toneClasses[tone]"
    :aria-label="label.title"
  >
    <p class="text-2xl font-black uppercase tracking-widest sm:text-3xl">{{ label.title }}</p>
    <p class="text-xs uppercase tracking-[0.35em]">{{ label.subtitle }}</p>
  </div>
</template>
