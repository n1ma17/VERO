<script setup lang="ts">
import { JALALI_MONTH_NAMES, formatJalaliMonth } from '@/utils/jalali'

const props = defineProps<{
  year: number
  month: number
  label?: string
}>()

const emit = defineEmits<{
  'update:year': [year: number]
  'update:month': [month: number]
}>()

const monthLabel = () => formatJalaliMonth(props.year, props.month)

function selectMonth(month: number) {
  emit('update:month', month)
}

function changeYear(delta: number) {
  emit('update:year', props.year + delta)
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-text-muted">
      {{ label }}
    </label>
    <div
      class="rounded-3xl border border-primary/20 bg-surface px-4 py-4 text-text"
    >
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="rounded-[8px] text-accent border border-accent px-3 py-1 text-sm transition hover:bg-accent"
          aria-label="Year minus"
          @click="changeYear(-1)"
        >
          Year −
        </button>
        <span class="font-mono text-sm font-semibold">{{ monthLabel() }}</span>
        <button
          type="button"
          class="rounded-[8px] text-accent border border-accent px-3 py-1 text-sm transition hover:bg-accent"
          aria-label="Year plus"
          @click="changeYear(1)"
        >
          Year +
        </button>
      </div>
      <div class="mt-3 grid grid-cols-4 gap-1.5">
        <button
          v-for="(name, index) in JALALI_MONTH_NAMES"
          :key="name"
          type="button"
          class="rounded-[8px] px-1 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          :class="
            month === index + 1
              ? 'bg-accent text-primary shadow-sm'
              : 'text-text hover:bg-primary/50'
          "
          @click="selectMonth(index + 1)"
        >
          {{ name.slice(0, 3) }}
        </button>
      </div>
    </div>
  </div>
</template>
