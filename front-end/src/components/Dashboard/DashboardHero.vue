<script setup lang="ts">
import { computed } from 'vue'
import { displayCurrency, roundMoney } from '@/composables/useCurrency'
import { useDashboard } from '@/composables/useDashboard'
import {
  calendarWeekdayIndex,
  calendarWeekdayNames,
  formatCalendarDate,
} from '@/utils/calendar'
import { smoothPath } from '@/utils/chart'
import { formatMoney } from '@/utils/formatMoney'

const { today, monthLength, balance, monthNet, savingsRate, balanceTrend } = useDashboard()

const SPARK_WIDTH = 320
const SPARK_HEIGHT = 110
const SPARK_PAD = 10

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const todayLabel = computed(() => {
  const d = today.value
  const weekday = calendarWeekdayNames()[
    calendarWeekdayIndex(d.year, d.month, d.day)
  ]
  return `${weekday}, ${formatCalendarDate(d.year, d.month, d.day)}`
})

const monthProgress = computed(() =>
  Math.round((today.value.day / monthLength.value) * 100),
)

const netTone = computed(() => {
  if (monthNet.value < 0) return 'negative'
  if (monthNet.value > 0) return 'positive'
  return 'zero'
})

const netPillClasses = {
  positive: 'border border-stamp-approved/40 bg-stamp-approved/25 text-stamp-approved',
  negative: 'border border-status-overdue/40 bg-status-overdue/25 text-status-overdue',
  zero: 'border border-status-paid/40 bg-status-paid/25 text-status-paid',
} as const

const balanceClasses = {
  positive: 'text-text',
  negative: 'text-danger',
} as const

const balanceTone = computed(() =>
  roundMoney(balance.value, displayCurrency()) < 0 ? 'negative' : 'positive',
)

const netLabel = computed(() => {
  const value = roundMoney(monthNet.value, displayCurrency())
  const arrow = value < 0 ? '▼' : '▲'
  return `${arrow} ${value > 0 ? '+' : ''}${formatMoney(value)}`
})

const sparkPoints = computed(() => {
  const values = balanceTrend.value.map((point) => point.balance)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min
  const step = (SPARK_WIDTH - SPARK_PAD * 2) / Math.max(values.length - 1, 1)
  const innerHeight = SPARK_HEIGHT - SPARK_PAD * 2
  return values.map((value, index) => ({
    x: SPARK_PAD + index * step,
    y: range === 0 ? SPARK_HEIGHT / 2 : SPARK_PAD + ((max - value) / range) * innerHeight,
  }))
})

const sparkLine = computed(() => smoothPath(sparkPoints.value))
const lastPoint = computed(() => sparkPoints.value[sparkPoints.value.length - 1])

const actionClasses = {
  primary: 'bg-accent text-on-accent',
  secondary: 'border border-text/30 text-text hover:border-text',
} as const

const actions = [
  { to: '/deposits', label: 'Add deposit', tone: 'primary' },
  { to: '/expenses/entry', label: 'Add expense', tone: 'secondary' },
  { to: '/bills/entry', label: 'New bill', tone: 'secondary' },
  { to: '/transactions', label: 'Statement', tone: 'secondary' },
] as const
</script>

<template>
  <section
    class="animate-fade-up border-y-2 border-text py-6 text-text motion-reduce:animate-none sm:py-8"
  >
    <div class="grid min-w-0 gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
      <div class="min-w-0">
        <p class="text-sm">{{ todayLabel }}</p>
        <h1 class="mt-1 text-3xl font-extrabold sm:text-4xl text-accent">{{ greeting }}</h1>

        <p class="mt-8 text-xs font-medium uppercase tracking-[0.25em]">Remaining balance</p>
        <p
          class="mt-2 break-words font-display text-4xl font-extrabold leading-none tracking-[-0.03em] tabular-nums sm:text-5xl md:text-6xl"
          :class="balanceClasses[balanceTone]"
        >
          {{ formatMoney(balance) }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            :class="netPillClasses[netTone]"
          >
            {{ netLabel }}
          </span>
          <span>net this month</span>
          <span v-if="savingsRate !== null">
            · {{ savingsRate >= 0 ? `keeping ${savingsRate}%` : 'overspending' }} of deposits
          </span>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <RouterLink
            v-for="action in actions"
            :key="action.to"
            :to="action.to"
            class="inline-flex min-h-11 items-center justify-center rounded-sm px-3 py-2 text-center text-sm font-semibold transition sm:px-5 sm:py-2.5"
            :class="actionClasses[action.tone]"
          >
            {{ action.label }}
          </RouterLink>
        </div>
      </div>

      <div class="min-w-0 border-t border-text/20 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div class="flex items-baseline justify-between">
          <p class="text-sm font-medium">Balance trend</p>
          <p class="text-xs">Last 6 months</p>
        </div>

        <svg
          :viewBox="`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`"
          class="mt-3 h-28 w-full max-w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            :d="sparkLine"
            fill="none"
            class="stroke-text"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-if="lastPoint"
            :cx="lastPoint.x"
            :cy="lastPoint.y"
            r="4"
            class="fill-accent"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div
          class="mt-2 grid grid-cols-6 gap-0.5 border-t border-text/30 pt-2 text-center text-[9px] uppercase tracking-wide sm:text-[10px] sm:tracking-wider"
        >
          <span v-for="point in balanceTrend" :key="`${point.year}-${point.month}`" class="truncate">
            {{ point.label }}
          </span>
        </div>

        <div class="mt-5 border-t border-text/20 pt-4">
          <div class="flex justify-between text-xs">
            <span>Month progress</span>
            <span>Day {{ today.day }} of {{ monthLength }}</span>
          </div>
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" class="mt-2 h-1 w-full" aria-hidden="true">
            <rect width="100" height="4" class="fill-text/20" />
            <rect :width="monthProgress" height="4" class="fill-text" />
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>
