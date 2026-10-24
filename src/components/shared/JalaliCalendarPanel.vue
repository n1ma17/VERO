<script setup lang="ts">
import { computed } from 'vue'
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  buildMonthDayGrid,
  currentJalaliDate,
  formatJalaliMonth,
  nextJalaliMonth,
  previousJalaliMonth,
} from '@/utils/jalali'

const props = defineProps<{
  year: number
  month: number
  selectedDay: number
}>()

const emit = defineEmits<{
  'update:year': [year: number]
  'update:month': [month: number]
  'update:day': [day: number]
}>()

const today = currentJalaliDate()
const monthLabel = computed(() => formatJalaliMonth(props.year, props.month))
const dayCells = computed(() => buildMonthDayGrid(props.year, props.month))

const dayCellClasses = {
  base:
    'flex size-9 items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
  default: 'text-content-on-surface hover:bg-accent/50',
  today: 'ring-2 ring-primary/40 ring-offset-1 ring-offset-surface',
  selected: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  muted: 'pointer-events-none opacity-0',
}

function cellClass(day: number | null): string {
  if (day === null) return `${dayCellClasses.base} ${dayCellClasses.muted}`
  const isSelected = day === props.selectedDay
  const isToday =
    props.year === today.year && props.month === today.month && day === today.day
  if (isSelected) return `${dayCellClasses.base} ${dayCellClasses.selected}`
  return `${dayCellClasses.base} ${dayCellClasses.default} ${isToday ? dayCellClasses.today : ''}`
}

function selectDay(day: number) {
  emit('update:year', props.year)
  emit('update:month', props.month)
  emit('update:day', day)
}

function shiftMonth(delta: number) {
  const target =
    delta < 0
      ? previousJalaliMonth(props.year, props.month)
      : nextJalaliMonth(props.year, props.month)
  emit('update:year', target.year)
  emit('update:month', target.month)
}

function selectMonth(month: number) {
  emit('update:month', month)
}
</script>

<template>
  <div
    class="overflow-hidden rounded-3xl border border-border-subtle/40 bg-surface text-content-on-surface shadow-xl"
  >
    <div class="border-b border-border-subtle/30 bg-primary-soft/40 px-4 py-3">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="rounded-full border border-border-subtle/50 px-3 py-1 text-sm transition hover:bg-accent"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          ‹
        </button>
        <div class="text-center">
          <p class="text-xs font-medium uppercase tracking-widest text-content-on-surface-muted">
            Jalali calendar
          </p>
          <p class="font-semibold">{{ monthLabel }}</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-border-subtle/50 px-3 py-1 text-sm transition hover:bg-accent"
          aria-label="Next month"
          @click="shiftMonth(1)"
        >
          ›
        </button>
      </div>
    </div>

    <div class="grid grid-cols-6 gap-1 border-b border-border-subtle/20 px-3 py-2">
      <button
        v-for="(name, index) in JALALI_MONTH_NAMES"
        :key="name"
        type="button"
        class="truncate rounded-lg px-1 py-1 text-[10px] font-medium transition sm:text-xs"
        :class="
          index + 1 === month
            ? 'bg-primary text-on-primary'
            : 'text-content-on-surface-muted hover:bg-accent/40'
        "
        @click="selectMonth(index + 1)"
      >
        {{ name.slice(0, 3) }}
      </button>
    </div>

    <div class="px-3 pb-4 pt-3">
      <div class="mb-2 grid grid-cols-7 gap-1">
        <span
          v-for="weekday in JALALI_WEEKDAY_NAMES"
          :key="weekday"
          class="text-center text-[10px] font-semibold uppercase tracking-wide text-content-on-surface-muted sm:text-xs"
        >
          {{ weekday }}
        </span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="(day, index) in dayCells"
          :key="`${month}-${index}`"
          type="button"
          :class="cellClass(day)"
          :disabled="day === null"
          :aria-label="day ? `Day ${day}` : undefined"
          @click="day && selectDay(day)"
        >
          {{ day ?? '' }}
        </button>
      </div>

      <div class="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-border-subtle/40 pt-3">
        <button
          type="button"
          class="rounded-full border border-border-subtle/50 px-3 py-1 text-xs transition hover:bg-accent"
          @click="emit('update:year', year - 1)"
        >
          Year −
        </button>
        <span class="font-mono text-sm font-semibold">{{ year }}</span>
        <button
          type="button"
          class="rounded-full border border-border-subtle/50 px-3 py-1 text-xs transition hover:bg-accent"
          @click="emit('update:year', year + 1)"
        >
          Year +
        </button>
      </div>
    </div>
  </div>
</template>
