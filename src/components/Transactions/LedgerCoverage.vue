<script setup lang="ts">
import { computed } from 'vue'
import { useLedger } from '@/composables/useLedger'
import { formatToman } from '@/utils/formatToman'

const { monthIncome, monthBills, monthExpenses, monthSpending, monthNet } = useLedger()

function percentOfIncome(value: number) {
  return monthIncome.value > 0 ? (value / monthIncome.value) * 100 : 0
}

const usedPercent = computed(() => {
  if (monthIncome.value <= 0) return monthSpending.value > 0 ? 100 : 0
  return Math.round(percentOfIncome(monthSpending.value))
})

const isOver = computed(() => monthNet.value < 0)

/** Bills then expenses, stacked and capped at the full bar width. */
const segments = computed(() => {
  if (monthIncome.value <= 0) {
    return { bills: monthSpending.value > 0 ? 100 : 0, expenses: 0 }
  }
  const bills = Math.min(100, percentOfIncome(monthBills.value))
  const expenses = Math.min(100 - bills, percentOfIncome(monthExpenses.value))
  return { bills, expenses }
})

const verdict = computed(() => {
  if (monthIncome.value <= 0 && monthSpending.value <= 0) return 'Nothing recorded for this month yet.'
  if (monthIncome.value <= 0) return 'No deposits counted — spending is fully uncovered.'
  if (isOver.value) return `Spending exceeds deposits by ${formatToman(-monthNet.value)}.`
  return `${formatToman(monthNet.value)} left after bills and expenses.`
})
</script>

<template>
  <section class="flex flex-col rounded-3xl bg-surface p-6 text-content-on-surface shadow-lg">
    <h2 class="text-lg font-semibold">Spending coverage</h2>
    <p class="mt-0.5 text-xs text-content-on-surface-muted">Share of deposits used by bills and expenses</p>

    <p class="mt-6 font-mono text-4xl font-bold" :class="isOver ? 'text-danger' : 'text-success'">
      {{ monthIncome > 0 ? `${usedPercent}%` : '—' }}
    </p>

    <svg viewBox="0 0 100 8" preserveAspectRatio="none" class="mt-4 h-3 w-full overflow-hidden rounded-full" aria-hidden="true">
      <rect x="0" y="0" width="100" height="8" class="fill-primary-soft/20" />
      <rect x="0" y="0" :width="segments.bills" height="8" class="fill-danger" />
      <rect :x="segments.bills" y="0" :width="segments.expenses" height="8" class="fill-warning" />
    </svg>

    <p class="mt-4 text-sm text-content-on-surface-muted">{{ verdict }}</p>

    <dl class="mt-auto space-y-2 border-t border-border-subtle/30 pt-4 text-sm">
      <div class="flex justify-between gap-4">
        <dt class="text-content-on-surface-muted">Deposits</dt>
        <dd class="font-mono">{{ formatToman(monthIncome) }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="flex items-center gap-2 text-content-on-surface-muted">
          <span class="size-2 rounded-full bg-danger" /> Bills
        </dt>
        <dd class="font-mono">{{ formatToman(monthBills) }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="flex items-center gap-2 text-content-on-surface-muted">
          <span class="size-2 rounded-full bg-warning" /> Expenses
        </dt>
        <dd class="font-mono">{{ formatToman(monthExpenses) }}</dd>
      </div>
    </dl>
  </section>
</template>
