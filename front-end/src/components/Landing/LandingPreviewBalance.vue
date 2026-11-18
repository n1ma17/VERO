<script setup lang="ts">
import { formatTomanCompact, formatTomanNumber } from '@/utils/formatToman'

const CHART_HEIGHT = 120
const SLOT_WIDTH = 50
const BAR_WIDTH = 30
const CAP_HEIGHT = 3

const trend = [
  { label: 'Kho', balance: 6_200_000 },
  { label: 'Tir', balance: 9_100_000 },
  { label: 'Mor', balance: 7_800_000 },
  { label: 'Sha', balance: 11_400_000 },
  { label: 'Meh', balance: 15_270_000 },
  { label: 'Aba', balance: 28_420_000 },
]

const maxBalance = Math.max(...trend.map((point) => point.balance))
const chartWidth = trend.length * SLOT_WIDTH

const bars = trend.map((point, index) => {
  const height = Math.round((point.balance / maxBalance) * CHART_HEIGHT)
  return {
    ...point,
    x: index * SLOT_WIDTH,
    y: CHART_HEIGHT - height,
    height,
    current: index === trend.length - 1,
  }
})
const currentBar = bars[bars.length - 1]!

const barClasses = {
  current: 'fill-text',
  past: 'fill-text/35',
} as const

const dueBills = [
  { name: 'Internet', amount: 1_200_000, when: 'Overdue', overdue: true },
  { name: 'Car insurance', amount: 3_400_000, when: '02 Azar', overdue: false },
]

const dueClasses = {
  overdue: 'text-accent',
  upcoming: '',
} as const
</script>

<template>
  <div class="min-w-0">
    <p class="text-xs uppercase tracking-[0.18em]">Remaining balance</p>
    <p
      class="mt-3 font-display text-5xl font-extrabold leading-none tracking-[-0.03em] tabular-nums sm:text-6xl"
    >
      {{ formatTomanNumber(28_420_000) }}
    </p>
    <p class="mt-3 text-sm">
      Toman <span class="mx-1" aria-hidden="true">·</span> +{{ formatTomanNumber(13_150_000) }} net
      this month
    </p>

    <div class="mt-10">
      <div class="flex items-baseline justify-between text-xs uppercase tracking-[0.18em]">
        <span>Balance trend</span>
        <span>{{ formatTomanCompact(maxBalance) }}</span>
      </div>
      <svg
        :viewBox="`0 0 ${chartWidth} ${CHART_HEIGHT}`"
        class="mt-4 h-32 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          v-for="bar in bars"
          :key="bar.label"
          :x="bar.x"
          :y="bar.y"
          :width="BAR_WIDTH"
          :height="bar.height"
          :class="bar.current ? barClasses.current : barClasses.past"
        />
        <rect
          :x="currentBar.x"
          :y="currentBar.y"
          :width="BAR_WIDTH"
          :height="CAP_HEIGHT"
          class="fill-accent"
        />
      </svg>
      <div class="mt-2 grid grid-cols-6 border-t border-text/30 pt-2 text-xs">
        <span v-for="bar in bars" :key="bar.label">{{ bar.label }}</span>
      </div>
    </div>

    <div class="mt-10">
      <p class="text-xs uppercase tracking-[0.18em]">Due</p>
      <ul class="mt-3 border-t border-text/20">
        <li
          v-for="bill in dueBills"
          :key="bill.name"
          class="flex items-baseline justify-between gap-4 border-b border-text/20 py-3 text-sm"
        >
          <span class="font-medium">{{ bill.name }}</span>
          <span class="flex items-baseline gap-4 tabular-nums">
            {{ formatTomanNumber(bill.amount) }}
            <span
              class="w-16 text-right text-xs uppercase tracking-wide"
              :class="bill.overdue ? dueClasses.overdue : dueClasses.upcoming"
            >
              {{ bill.when }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
