<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInstallments } from '@/composables/useInstallments'
import type { InstallmentStatus } from '@/types/installment'
import { OTHERS_COMPANY_LABEL } from '@/types/company'
import { currencyUnit, formatMoneyCompact, formatMoneyNumber } from '@/utils/formatMoney'
import { getInstallmentStatus, installmentStatusLabels } from '@/utils/installmentStatus'

const COLLAPSED_COUNT = 6

const VIEW_W = 300
const VIEW_H = 156
const PAD_X = 10
const PAD_TOP = 12
const MIN_BAR_H_FOR_INNER_AMOUNT = 22
const PAD_BOTTOM = 28
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM

const FILLS = [
  'fill-accent',
  'fill-status-paid',
  'fill-status-unpaid',
  'fill-status-overdue',
  'fill-stamp-approved',
  'fill-deposit-card-sky',
  'fill-deposit-card-mint',
  'fill-deposit-card-lilac',
  'fill-deposit-card-rose',
  'fill-text',
] as const

const statusDots: Record<InstallmentStatus, string> = {
  paid: 'bg-status-paid',
  unpaid: 'bg-status-unpaid',
  overdue: 'bg-status-overdue',
}

const statusOrder: InstallmentStatus[] = ['paid', 'unpaid', 'overdue']

const valueClasses: Record<InstallmentStatus, string> = {
  paid: 'text-success',
  unpaid: 'text-warning',
  overdue: 'text-danger',
}

const { installments } = useInstallments()

const expanded = ref(false)

type CompanyTotal = {
  key: string
  label: string
  amount: number
  count: number
  colorIndex: number
}

type ColumnBar = {
  key: string
  label: string
  shortLabel: string
  amount: number
  pct: number
  fill: string
  x: number
  y: number
  width: number
  height: number
  amountX: number
  amountY: number
  amountLabel: string
  amountInside: boolean
  labelY: number
  labelX: number
}

function shortLabel(name: string, max = 9) {
  const trimmed = name.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`
}

const companyTotals = computed(() => {
  const map = new Map<string, CompanyTotal>()
  for (const row of installments.value) {
    const key = row.companyId ?? ''
    const label = row.companyName?.trim() || OTHERS_COMPANY_LABEL
    const existing = map.get(key)
    if (existing) {
      existing.amount += row.amount
      existing.count += 1
    } else {
      map.set(key, {
        key,
        label,
        amount: row.amount,
        count: 1,
        colorIndex: map.size % FILLS.length,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
})

const monthTotal = computed(() =>
  companyTotals.value.reduce((sum, row) => sum + row.amount, 0),
)

const largest = computed(() => companyTotals.value[0]?.amount ?? 0)

const hasMore = computed(() => companyTotals.value.length > COLLAPSED_COUNT)

const visibleTotals = computed(() =>
  expanded.value ? companyTotals.value : companyTotals.value.slice(0, COLLAPSED_COUNT),
)

watch(
  () => companyTotals.value.map((row) => `${row.key}:${row.amount}`).join('|'),
  () => {
    expanded.value = false
  },
)

const columnBars = computed((): ColumnBar[] => {
  const items = visibleTotals.value
  const total = monthTotal.value
  const max = largest.value
  if (!items.length || max <= 0) return []

  const plotW = VIEW_W - PAD_X * 2
  const slotW = plotW / items.length
  const barW = Math.min(26, slotW * 0.58)
  const baseY = PAD_TOP + PLOT_H

  return items.map((row, index) => {
    const height = Math.max((row.amount / max) * PLOT_H, row.amount > 0 ? 4 : 0)
    const cx = PAD_X + slotW * index + slotW / 2
    const x = cx - barW / 2
    const y = baseY - height
    const pct = total > 0 ? Math.round((row.amount / total) * 100) : 0
    const maxLabelChars = slotW >= 44 ? 10 : slotW >= 36 ? 8 : 6

    return {
      key: row.key || 'others',
      label: row.label,
      shortLabel: shortLabel(row.label, maxLabelChars),
      amount: row.amount,
      pct,
      fill: FILLS[row.colorIndex],
      x,
      y,
      width: barW,
      height,
      amountX: cx,
      amountY: height >= MIN_BAR_H_FOR_INNER_AMOUNT ? y + height / 2 : Math.max(y - 2, PAD_TOP + 4),
      amountLabel: formatMoneyCompact(row.amount),
      amountInside: height >= MIN_BAR_H_FOR_INNER_AMOUNT,
      labelY: baseY + 14,
      labelX: cx,
    }
  })
})

const chartAriaLabel = computed(() => {
  if (!columnBars.value.length) return 'No company breakdown'
  return columnBars.value
    .map((row) => `${row.label} ${row.pct}%`)
    .join(', ')
})

const statusStats = computed(() => {
  const counts: Record<InstallmentStatus, number> = { paid: 0, unpaid: 0, overdue: 0 }
  const amounts: Record<InstallmentStatus, number> = { paid: 0, unpaid: 0, overdue: 0 }
  for (const installment of installments.value) {
    const status = getInstallmentStatus(installment)
    counts[status]++
    amounts[status] += installment.amount
  }
  return { counts, amounts }
})
</script>

<template>
  <section
    class="min-w-0 rounded-3xl bg-surface p-4 text-text sm:p-6"
    aria-labelledby="installments-month-overview"
  >
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="installments-month-overview" class="text-sm font-semibold">By company</h2>
      <p class="font-mono text-xs text-text-muted">
        {{ formatMoneyNumber(monthTotal) }}
        <span class="font-sans">{{ currencyUnit() }}</span>
      </p>
    </div>

    <div
      v-if="installments.length && columnBars.length"
      class="mt-6 grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:items-center"
    >
      <div class="min-w-0">
        <svg
          :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
          class="block h-auto w-full"
          role="img"
          :aria-label="chartAriaLabel"
        >
          <line
            :x1="PAD_X"
            :y1="PAD_TOP + PLOT_H"
            :x2="VIEW_W - PAD_X"
            :y2="PAD_TOP + PLOT_H"
            class="stroke-primary/20"
            stroke-width="1"
          />
          <g v-for="bar in columnBars" :key="bar.key">
            <rect
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              rx="2"
              :class="bar.fill"
            >
              <title>
                {{ bar.label }} — {{ formatMoneyNumber(bar.amount) }} {{ currencyUnit() }} ({{
                  bar.pct
                }}%)
              </title>
            </rect>
            <text
              :x="bar.amountX"
              :y="bar.amountY"
              :text-anchor="bar.amountInside ? 'middle' : 'start'"
              dominant-baseline="middle"
              class="font-mono pointer-events-none"
              :class="bar.amountInside ? 'fill-on-accent' : 'fill-text'"
              font-size="6.5"
              font-weight="600"
              :transform="`rotate(-90 ${bar.amountX} ${bar.amountY})`"
            >
              {{ bar.amountLabel }}
            </text>
            <text
              :x="bar.labelX"
              :y="bar.labelY"
              text-anchor="middle"
              class="fill-text font-sans"
              font-size="8"
              font-weight="600"
            >
              {{ bar.shortLabel }}
            </text>
          </g>
        </svg>

        <button
          v-if="hasMore && !expanded"
          type="button"
          class="mt-2 text-xs font-medium text-accent hover:underline"
          @click="expanded = true"
        >
          Show more ({{ companyTotals.length - COLLAPSED_COUNT }} more)
        </button>
        <button
          v-else-if="hasMore && expanded"
          type="button"
          class="mt-2 text-xs font-medium text-accent hover:underline"
          @click="expanded = false"
        >
          Show less
        </button>
      </div>

      <dl class="flex min-w-0 flex-col divide-y divide-primary/15">
        <div
          v-for="status in statusOrder"
          :key="status"
          class="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <dt class="flex min-w-0 items-center gap-2">
            <span class="size-2.5 shrink-0 rounded-full" :class="statusDots[status]" />
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">
              {{ installmentStatusLabels[status] }}
            </span>
          </dt>
          <dd class="text-end">
            <p class="font-mono text-2xl font-bold leading-none" :class="valueClasses[status]">
              {{ statusStats.counts[status] }}
            </p>
            <p
              class="mt-1 font-mono text-[10px] font-semibold leading-tight sm:text-xs"
              :class="valueClasses[status]"
            >
              {{ formatMoneyNumber(statusStats.amounts[status]) }}
              <span class="font-sans text-[9px] font-medium opacity-80 sm:text-[10px]">{{
                currencyUnit()
              }}</span>
            </p>
          </dd>
        </div>
      </dl>
    </div>

    <p
      v-else
      class="mt-6 rounded-sm border border-dashed border-text/30 p-6 text-center text-sm text-text-muted"
    >
      No installments this month to chart.
    </p>
  </section>
</template>