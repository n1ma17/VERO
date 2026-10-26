<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/date'

const props = withDefaults(
  defineProps<{
    paidAt?: string | null
    size?: 'sm' | 'lg'
  }>(),
  { paidAt: null, size: 'sm' },
)

const sizeClasses = {
  sm: { box: 'px-3 py-1', title: 'text-sm sm:text-base', date: 'text-[10px] sm:text-xs' },
  lg: { box: 'px-4 py-2 sm:px-5', title: 'text-2xl sm:text-3xl', date: 'text-xs sm:text-sm' },
}

const classes = computed(() => sizeClasses[props.size])
const formattedDate = computed(() => (props.paidAt ? formatDate(props.paidAt) : null))
</script>

<template>
  <div
    class="pointer-events-none -rotate-12 select-none rounded-xl border-4 border-double border-success text-center font-mono text-success opacity-80"
    :class="classes.box"
    aria-label="Approved"
  >
    <p class="font-black uppercase tracking-widest" :class="classes.title">Approved</p>
    <p v-if="formattedDate" class="uppercase tracking-wider" :class="classes.date">
      {{ formattedDate }}
    </p>
  </div>
</template>
