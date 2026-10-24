<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { areaPath, niceScale, smoothPath } from '@/utils/chart'
import { formatJalaliMonth } from '@/utils/jalali'
import { formatToman, formatTomanCompact } from '@/utils/formatToman'

const { cashFlow } = useDashboard()

const WIDTH = 720
const HEIGHT = 260
const PAD_LEFT = 52
const PAD_RIGHT = 16
const PAD_TOP = 12
const PAD_BOTTOM = 30

const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

const hoveredIndex = ref<number | null>(null)

const scale = computed(() => {
  const nice = niceScale(cashFlow.value.flatMap((point) => [point.income, point.bills, point.expenses]))
  return { ...nice, range: nice.max - nice.min || 1 }
})

const step = computed(() => plotWidth / Math.max(cashFlow.value.length - 1, 1))

function x(index: number) {
  return PAD_LEFT + index * step.value
}

function y(value: number) {
  return PAD_TOP + ((scale.value.max - value) / scale.value.range) * plotHeight
}

const incomePoints = computed(() => cashFlow.value.map((p, i) => ({ x: x(i), y: y(p.income) })))
const billPoints = computed(() => cashFlow.value.map((p, i) => ({ x: x(i), y: y(p.bills) })))
const expensePoints = computed(() => cashFlow.value.map((p, i) => ({ x: x(i), y: y(p.expenses) })))
const baseline = computed(() => y(0))

const ticks = computed(() =>
  scale.value.ticks.map((value) => ({ value, y: y(value), label: formatTomanCompact(value) })),
)

const totals = computed(() =>
  cashFlow.value.reduce(
    (sum, point) => ({
      income: sum.income + point.income,
      bills: sum.bills + point.bills,
      expenses: sum.expenses + point.expenses,
    }),
    { income: 0, bills: 0, expenses: 0 },
  ),
)

const averages = computed(() => {
  const months = cashFlow.value.length || 1
  return {
    income: totals.value.income / months,
    spending: (totals.value.bills + totals.value.expenses) / months,
  }
})

const bestMonth = computed(() => {
  const net = (point: (typeof cashFlow.value)[number]) => point.income - point.bills - point.expenses
  const best = cashFlow.value.reduce<(typeof cashFlow.value)[number] | null>(
    (top, point) => (!top || net(point) > net(top) ? point : top),
    null,
  )
  if (!best || net(best) <= 0) return null
  return { label: formatJalaliMonth(best.year, best.month), net: net(best) }
})

const activeIndex = computed(() => hoveredIndex.value ?? cashFlow.value.length - 1)
const activePoint = computed(() => cashFlow.value[activeIndex.value])
</script>

<template>
  <section
    class="flex animate-fade-up flex-col rounded-3xl bg-surface p-6 text-content-on-surface shadow-lg [animation-delay:300ms] motion-reduce:animate-none"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Cash flow</h2>
        <p class="mt-0.5 text-xs text-content-on-surface-muted">Deposits vs. bills and expenses, last 12 months</p>
      </div>
      <div class="flex flex-wrap gap-6 text-right">
        <div>
          <p class="flex items-center justify-end gap-1.5 text-xs text-content-on-surface-muted">
            <span class="size-2 rounded-full bg-success" /> Deposits
          </p>
          <p class="font-mono text-sm font-semibold">{{ formatToman(totals.income) }}</p>
        </div>
        <div>
          <p class="flex items-center justify-end gap-1.5 text-xs text-content-on-surface-muted">
            <span class="size-2 rounded-full bg-danger" /> Bills
          </p>
          <p class="font-mono text-sm font-semibold">{{ formatToman(totals.bills) }}</p>
        </div>
        <div>
          <p class="flex items-center justify-end gap-1.5 text-xs text-content-on-surface-muted">
            <span class="size-2 rounded-full bg-warning" /> Expenses
          </p>
          <p class="font-mono text-sm font-semibold">{{ formatToman(totals.expenses) }}</p>
        </div>
      </div>
    </div>

    <div class="relative mt-4">
      <div
        v-if="activePoint"
        class="pointer-events-none absolute right-0 top-0 z-10 rounded-2xl border border-border-subtle/30 bg-surface/95 px-3 py-2 text-xs shadow-md"
      >
        <p class="font-semibold">{{ formatJalaliMonth(activePoint.year, activePoint.month) }}</p>
        <p class="mt-1 font-mono text-success">+{{ formatToman(activePoint.income) }}</p>
        <p class="font-mono text-danger">−{{ formatToman(activePoint.bills) }}</p>
        <p class="font-mono text-warning">−{{ formatToman(activePoint.expenses) }}</p>
      </div>

      <svg
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        class="h-auto w-full"
        role="img"
        aria-label="Deposits, bills and expenses over the last twelve months"
        @mouseleave="hoveredIndex = null"
      >
        <line
          v-for="tick in ticks"
          :key="tick.value"
          :x1="PAD_LEFT"
          :x2="WIDTH - PAD_RIGHT"
          :y1="tick.y"
          :y2="tick.y"
          class="stroke-border-subtle/25"
          stroke-dasharray="3 5"
        />
        <text
          v-for="tick in ticks"
          :key="`t-${tick.value}`"
          :x="PAD_LEFT - 8"
          :y="tick.y + 4"
          text-anchor="end"
          class="fill-content-on-surface-muted text-[10px]"
        >
          {{ tick.label }}
        </text>

        <path :d="areaPath(incomePoints, baseline)" class="fill-success/12" />
        <path :d="areaPath(billPoints, baseline)" class="fill-danger/10" />
        <path :d="areaPath(expensePoints, baseline)" class="fill-warning/10" />
        <path
          :d="smoothPath(incomePoints)"
          fill="none"
          class="stroke-success"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          :d="smoothPath(billPoints)"
          fill="none"
          class="stroke-danger"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-dasharray="6 4"
        />
        <path
          :d="smoothPath(expensePoints)"
          fill="none"
          class="stroke-warning"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-dasharray="2 4"
        />

        <line
          :x1="x(activeIndex)"
          :x2="x(activeIndex)"
          :y1="PAD_TOP"
          :y2="baseline"
          class="stroke-content-on-surface-muted/40"
          stroke-dasharray="2 3"
        />
        <circle
          :cx="x(activeIndex)"
          :cy="incomePoints[activeIndex]?.y"
          r="5"
          class="fill-success stroke-surface"
          stroke-width="2"
        />
        <circle
          :cx="x(activeIndex)"
          :cy="billPoints[activeIndex]?.y"
          r="5"
          class="fill-danger stroke-surface"
          stroke-width="2"
        />
        <circle
          :cx="x(activeIndex)"
          :cy="expensePoints[activeIndex]?.y"
          r="5"
          class="fill-warning stroke-surface"
          stroke-width="2"
        />

        <text
          v-for="(point, index) in cashFlow"
          :key="`m-${point.year}-${point.month}`"
          :x="x(index)"
          :y="HEIGHT - 8"
          text-anchor="middle"
          class="text-[10px]"
          :class="index === activeIndex ? 'fill-content-on-surface font-semibold' : 'fill-content-on-surface-muted'"
        >
          {{ point.label }}
        </text>

        <rect
          v-for="(point, index) in cashFlow"
          :key="`hit-${point.year}-${point.month}`"
          :x="x(index) - step / 2"
          :y="0"
          :width="step"
          :height="HEIGHT"
          fill="transparent"
          @mouseenter="hoveredIndex = index"
        />
      </svg>
    </div>

    <dl class="mt-auto grid grid-cols-1 gap-3 border-t border-border-subtle/30 pt-5 sm:grid-cols-3">
      <div class="rounded-2xl bg-success-soft/50 px-4 py-3">
        <dt class="text-xs text-content-on-surface-muted">Avg. monthly deposits</dt>
        <dd class="mt-1 font-mono text-sm font-semibold text-success">
          {{ formatToman(Math.round(averages.income)) }}
        </dd>
      </div>
      <div class="rounded-2xl bg-danger-soft/50 px-4 py-3">
        <dt class="text-xs text-content-on-surface-muted">Avg. monthly spending</dt>
        <dd class="mt-1 font-mono text-sm font-semibold text-danger">
          {{ formatToman(Math.round(averages.spending)) }}
        </dd>
      </div>
      <div class="rounded-2xl bg-accent/30 px-4 py-3">
        <dt class="text-xs text-content-on-surface-muted">Best month</dt>
        <dd v-if="bestMonth" class="mt-1 text-sm font-semibold">
          {{ bestMonth.label }}
          <span class="font-mono text-xs text-success">+{{ formatToman(bestMonth.net) }}</span>
        </dd>
        <dd v-else class="mt-1 text-sm text-content-on-surface-muted">No surplus yet</dd>
      </div>
    </dl>
  </section>
</template>
