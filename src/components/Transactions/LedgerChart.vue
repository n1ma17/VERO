<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLedger } from '@/composables/useLedger'
import { niceScale } from '@/utils/chart'
import { formatJalaliMonth } from '@/utils/jalali'
import { formatToman, formatTomanCompact } from '@/utils/formatToman'

const { chartSeries, viewMonth, setViewMonth } = useLedger()

const WIDTH = 640
const HEIGHT = 260
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 32
const TICK_COUNT = 4

const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

const hoveredIndex = ref<number | null>(null)

const scale = computed(() => {
  const values = chartSeries.value.flatMap((point) => [point.income, point.bills, point.expenses, point.balance])
  const nice = niceScale(values, TICK_COUNT)
  return { ...nice, range: nice.max - nice.min || 1 }
})

function y(value: number): number {
  const { max, range } = scale.value
  return PAD_TOP + ((max - value) / range) * plotHeight
}

const groupWidth = computed(() => plotWidth / chartSeries.value.length)
const barWidth = computed(() => Math.min(18, groupWidth.value * 0.22))

const groups = computed(() =>
  chartSeries.value.map((point, index) => {
    const left = PAD_LEFT + index * groupWidth.value
    const center = left + groupWidth.value / 2
    const zero = y(0)
    return {
      point,
      index,
      left,
      center,
      income: { x: center - barWidth.value * 1.5 - 3, y: y(point.income), height: zero - y(point.income) },
      bills: { x: center - barWidth.value / 2, y: y(point.bills), height: zero - y(point.bills) },
      expenses: {
        x: center + barWidth.value / 2 + 3,
        y: y(point.expenses),
        height: zero - y(point.expenses),
      },
      balanceY: y(point.balance),
      isView: point.year === viewMonth.value.year && point.month === viewMonth.value.month,
    }
  }),
)

const balancePath = computed(() =>
  groups.value
    .map((group, i) => `${i === 0 ? 'M' : 'L'} ${group.center} ${group.balanceY}`)
    .join(' '),
)

const ticks = computed(() =>
  scale.value.ticks.map((value) => ({ value, y: y(value), label: formatTomanCompact(value) })),
)

const zeroY = computed(() => y(0))

const activeGroup = computed(() => {
  const index = hoveredIndex.value ?? groups.value.findIndex((group) => group.isView)
  return groups.value[index] ?? groups.value[groups.value.length - 1]
})

function selectMonth(year: number, month: number) {
  setViewMonth(year, month)
}
</script>

<template>
  <section class="rounded-3xl bg-surface p-6 text-content-on-surface shadow-lg">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Last 6 months</h2>
        <p class="mt-0.5 text-xs text-content-on-surface-muted">
          Click a month to open its statement.
        </p>
      </div>
      <div class="flex flex-wrap gap-4 text-xs text-content-on-surface-muted">
        <span class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm bg-success" /> Deposits
        </span>
        <span class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm bg-danger" /> Bills
        </span>
        <span class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-sm bg-warning" /> Expenses
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-0.5 w-4 rounded-full bg-content-on-surface" /> Balance
        </span>
      </div>
    </div>

    <dl
      v-if="activeGroup"
      class="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-primary-soft/10 px-4 py-3 text-sm sm:grid-cols-5"
    >
      <div>
        <dt class="text-xs text-content-on-surface-muted">Month</dt>
        <dd class="font-semibold">
          {{ formatJalaliMonth(activeGroup.point.year, activeGroup.point.month) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-content-on-surface-muted">Deposits</dt>
        <dd class="whitespace-nowrap font-mono text-xs text-success">{{ formatToman(activeGroup.point.income) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-content-on-surface-muted">Bills</dt>
        <dd class="whitespace-nowrap font-mono text-xs text-danger">{{ formatToman(activeGroup.point.bills) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-content-on-surface-muted">Expenses</dt>
        <dd class="whitespace-nowrap font-mono text-xs text-warning">{{ formatToman(activeGroup.point.expenses) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-content-on-surface-muted">Balance</dt>
        <dd
          class="whitespace-nowrap font-mono text-xs font-semibold"
          :class="activeGroup.point.balance < 0 ? 'text-danger' : 'text-content-on-surface'"
        >
          {{ formatToman(activeGroup.point.balance) }}
        </dd>
      </div>
    </dl>

    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="mt-4 h-auto w-full"
      role="img"
      aria-label="Deposits, bills, expenses and balance for the last six months"
      @mouseleave="hoveredIndex = null"
    >
      <g>
        <line
          v-for="tick in ticks"
          :key="tick.value"
          :x1="PAD_LEFT"
          :x2="WIDTH - PAD_RIGHT"
          :y1="tick.y"
          :y2="tick.y"
          class="stroke-border-subtle/25"
          stroke-dasharray="3 4"
        />
        <text
          v-for="tick in ticks"
          :key="`label-${tick.value}`"
          :x="PAD_LEFT - 8"
          :y="tick.y + 4"
          text-anchor="end"
          class="fill-content-on-surface-muted text-[10px]"
        >
          {{ tick.label }}
        </text>
      </g>

      <rect
        v-for="group in groups"
        v-show="group.isView || hoveredIndex === group.index"
        :key="`bg-${group.index}`"
        :x="group.left + 4"
        :y="PAD_TOP"
        :width="groupWidth - 8"
        :height="plotHeight"
        rx="10"
        :class="group.isView ? 'fill-accent/30' : 'fill-primary-soft/10'"
      />

      <line
        :x1="PAD_LEFT"
        :x2="WIDTH - PAD_RIGHT"
        :y1="zeroY"
        :y2="zeroY"
        class="stroke-content-on-surface-muted/60"
      />

      <g v-for="group in groups" :key="`bars-${group.index}`">
        <rect
          :x="group.income.x"
          :y="group.income.y"
          :width="barWidth"
          :height="Math.max(group.income.height, 0)"
          rx="4"
          class="fill-success"
        />
        <rect
          :x="group.bills.x"
          :y="group.bills.y"
          :width="barWidth"
          :height="Math.max(group.bills.height, 0)"
          rx="4"
          class="fill-danger"
        />
        <rect
          :x="group.expenses.x"
          :y="group.expenses.y"
          :width="barWidth"
          :height="Math.max(group.expenses.height, 0)"
          rx="4"
          class="fill-warning"
        />
        <text
          :x="group.center"
          :y="HEIGHT - 10"
          text-anchor="middle"
          class="text-[11px]"
          :class="group.isView ? 'fill-content-on-surface font-semibold' : 'fill-content-on-surface-muted'"
        >
          {{ group.point.label }}
        </text>
      </g>

      <path
        :d="balancePath"
        fill="none"
        class="stroke-content-on-surface"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle
        v-for="group in groups"
        :key="`dot-${group.index}`"
        :cx="group.center"
        :cy="group.balanceY"
        r="4.5"
        class="stroke-surface"
        stroke-width="2"
        :class="group.point.balance < 0 ? 'fill-danger' : 'fill-content-on-surface'"
      />

      <rect
        v-for="group in groups"
        :key="`hit-${group.index}`"
        :x="group.left"
        :y="PAD_TOP"
        :width="groupWidth"
        :height="plotHeight + PAD_BOTTOM"
        fill="transparent"
        class="cursor-pointer"
        @mouseenter="hoveredIndex = group.index"
        @click="selectMonth(group.point.year, group.point.month)"
      />
    </svg>
  </section>
</template>
