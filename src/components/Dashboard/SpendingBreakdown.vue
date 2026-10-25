<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard, type SpendingSlice } from '@/composables/useDashboard'
import { expenseCategories } from '@/utils/expenseCategories'
import { formatJalaliMonth } from '@/utils/jalali'
import { formatTomanCompact, formatTomanNumber } from '@/utils/formatToman'

const { spendingBreakdown, monthSpending, today } = useDashboard()

const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

const billsStyle = { label: 'Bills & installments', stroke: 'stroke-danger', dot: 'bg-danger' }

function sliceStyle(key: SpendingSlice['key']) {
  if (key === 'bills') return billsStyle
  const meta = expenseCategories[key]
  return { label: meta.label, stroke: meta.stroke, dot: meta.dot }
}

const segments = computed(() => {
  const gap = spendingBreakdown.value.length > 1 ? GAP : 0
  let offset = 0
  return spendingBreakdown.value.map((slice) => {
    const length = Math.max(slice.share * CIRCUMFERENCE - gap, 0.5)
    const segment = {
      ...slice,
      ...sliceStyle(slice.key),
      dash: `${length} ${CIRCUMFERENCE}`,
      offset: -offset,
    }
    offset += slice.share * CIRCUMFERENCE
    return segment
  })
})

const monthLabel = formatJalaliMonth(today.year, today.month)
</script>

<template>
  <section
    class="animate-fade-up min-w-0 overflow-hidden rounded-3xl bg-surface p-6 text-text shadow-lg [animation-delay:420ms] motion-reduce:animate-none"
  >
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-lg font-semibold">Where money goes</h2>
      <span class="shrink-0 text-xs text-text-muted">{{ monthLabel }}</span>
    </div>

    <div
      v-if="segments.length"
      class="mt-6 grid min-w-0 gap-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start"
    >
      <div class="relative mx-auto size-36 shrink-0 sm:mx-0">
        <svg viewBox="0 0 160 160" class="size-full -rotate-90" aria-hidden="true">
          <circle cx="80" cy="80" :r="RADIUS" fill="none" stroke-width="18" class="stroke-primary/10" />
          <circle
            v-for="segment in segments"
            :key="segment.key"
            cx="80"
            cy="80"
            :r="RADIUS"
            fill="none"
            stroke-width="18"
            :stroke-dasharray="segment.dash"
            :stroke-dashoffset="segment.offset"
            :class="segment.stroke"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span class="text-[10px] uppercase tracking-wide text-text-muted">Spent</span>
          <span class="font-mono text-base font-bold leading-tight">
            {{ formatTomanCompact(monthSpending) }}
          </span>
        </div>
      </div>

      <ul class="min-w-0 space-y-3">
        <li
          v-for="segment in segments"
          :key="segment.key"
          class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-sm"
        >
          <span class="mt-1.5 size-3 shrink-0 rounded" :class="segment.dot" />
          <div class="min-w-0">
            <div class="flex min-w-0 items-baseline justify-between gap-2">
              <span class="truncate font-medium">{{ segment.label }}</span>
              <span class="shrink-0 font-mono text-xs text-text-muted">
                {{ Math.round(segment.share * 100) }}%
              </span>
            </div>
            <p class="truncate text-right font-mono text-xs font-semibold">
              {{ formatTomanNumber(segment.amount) }}
              <span class="font-sans font-normal text-text-muted"> Toman</span>
            </p>
          </div>
        </li>
      </ul>
    </div>

    <p v-else class="py-12 text-center text-sm text-text-muted">
      No bills or expenses this month.
    </p>
  </section>
</template>
