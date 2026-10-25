<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { JALALI_WEEKDAY_NAMES, formatJalaliDate, jalaliWeekdayIndex } from '@/utils/jalali'
import { areaPath, smoothPath } from '@/utils/chart'
import { formatToman } from '@/utils/formatToman'

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

const todayLabel = computed(
  () =>
    `${JALALI_WEEKDAY_NAMES[jalaliWeekdayIndex(today.year, today.month, today.day)]}, ${formatJalaliDate(today.year, today.month, today.day)}`,
)

const monthProgress = computed(() => Math.round((today.day / monthLength) * 100))

const netTone = computed(() => (monthNet.value < 0 ? 'negative' : 'positive'))

const netPillClasses = {
  positive: 'bg-success/20 text-success',
  negative: 'bg-danger/25 text-danger',
} as const

const balanceClasses = {
  positive: 'text-background',
  negative: 'text-danger',
} as const

const balanceTone = computed(() => (balance.value < 0 ? 'negative' : 'positive'))

const netLabel = computed(() => {
  const value = monthNet.value
  const arrow = value < 0 ? '▼' : '▲'
  return `${arrow} ${value > 0 ? '+' : ''}${formatToman(value)}`
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
const sparkArea = computed(() => areaPath(sparkPoints.value, SPARK_HEIGHT))
const lastPoint = computed(() => sparkPoints.value[sparkPoints.value.length - 1])

const actionClasses = {
  primary: 'bg-accent text-text hover:bg-accent',
  secondary: 'border border-background/15 bg-background/10 text-background hover:bg-background/20',
} as const

const actions = [
  { to: '/deposits', label: 'Add deposit', tone: 'primary' },
  { to: '/expenses/entry', label: 'Add expense', tone: 'secondary' },
  { to: '/bills', label: 'New bill', tone: 'secondary' },
  { to: '/transactions', label: 'Statement', tone: 'secondary' },
] as const
</script>

<template>
  <section
    class="relative isolate animate-fade-up overflow-hidden rounded-[2rem] bg-primary p-6 text-background shadow-2xl motion-reduce:animate-none sm:p-8"
  >
    <div
      class="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-accent/20 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-32 left-1/4 -z-10 size-80 rounded-full bg-success/10 blur-3xl"
      aria-hidden="true"
    />

    <div class="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
      <div>
        <p class="text-sm text-background/70">{{ todayLabel }}</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{{ greeting }}</h1>

        <p class="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-background/70">
          Remaining balance
        </p>
        <p
          class="mt-2 font-mono text-4xl font-bold tracking-tight sm:text-5xl"
          :class="balanceClasses[balanceTone]"
        >
          {{ formatToman(balance) }}
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold"
            :class="netPillClasses[netTone]"
          >
            {{ netLabel }}
          </span>
          <span class="text-background/70">net this month</span>
          <span v-if="savingsRate !== null" class="text-background/70">
            · {{ savingsRate >= 0 ? `keeping ${savingsRate}%` : 'overspending' }} of deposits
          </span>
        </div>

        <div class="mt-8 flex flex-wrap gap-2">
          <RouterLink
            v-for="action in actions"
            :key="action.to"
            :to="action.to"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition"
            :class="actionClasses[action.tone]"
          >
            {{ action.label }}
          </RouterLink>
        </div>
      </div>

      <div class="rounded-3xl border border-background/10 bg-background/5 p-5 backdrop-blur-sm">
        <div class="flex items-baseline justify-between">
          <p class="text-sm font-medium">Balance trend</p>
          <p class="text-xs text-background/70">Last 6 months</p>
        </div>

        <svg
          :viewBox="`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`"
          class="mt-3 h-28 w-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path :d="sparkArea" class="fill-accent/15" />
          <path
            :d="sparkLine"
            fill="none"
            class="stroke-accent"
            stroke-width="2.5"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-if="lastPoint"
            :cx="lastPoint.x"
            :cy="lastPoint.y"
            r="5"
            class="fill-accent stroke-primary"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div class="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-background/70">
          <span v-for="point in balanceTrend" :key="`${point.year}-${point.month}`">
            {{ point.label }}
          </span>
        </div>

        <div class="mt-5 border-t border-background/10 pt-4">
          <div class="flex justify-between text-xs text-background/70">
            <span>Month progress</span>
            <span>Day {{ today.day }} of {{ monthLength }}</span>
          </div>
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" class="mt-2 h-1.5 w-full" aria-hidden="true">
            <rect width="100" height="4" rx="2" class="fill-background/10" />
            <rect :width="monthProgress" height="4" rx="2" class="fill-success" />
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>
