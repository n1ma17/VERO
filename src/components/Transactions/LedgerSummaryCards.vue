<script setup lang="ts">
import { computed } from 'vue'
import { useLedger } from '@/composables/useLedger'
import { formatToman } from '@/utils/formatToman'

const {
  monthIncome,
  monthBills,
  monthExpenses,
  monthNet,
  openingBalance,
  closingBalance,
  depositCount,
  billCount,
  expenseCount,
  paidBillsTotal,
  unpaidBillsTotal,
} = useLedger()

const signedTextClasses = {
  positive: 'text-success',
  negative: 'text-danger',
} as const

const balanceCardClasses = {
  positive: 'bg-primary text-background',
  negative: 'bg-danger text-background',
} as const

const netTone = computed(() => (monthNet.value < 0 ? 'negative' : 'positive'))
const balanceTone = computed(() => (closingBalance.value < 0 ? 'negative' : 'positive'))

function signed(value: number) {
  return value > 0 ? `+${formatToman(value)}` : formatToman(value)
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
    <article class="rounded-3xl bg-surface p-5 text-text shadow-lg lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Deposits
      </p>
      <p class="mt-2 font-mono text-xl font-bold text-success">{{ formatToman(monthIncome) }}</p>
      <p class="mt-1 text-xs text-text-muted">{{ depositCount }} deposit(s) counted</p>
    </article>

    <article class="rounded-3xl bg-surface p-5 text-text shadow-lg lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Bills
      </p>
      <p class="mt-2 font-mono text-xl font-bold text-danger">{{ formatToman(monthBills) }}</p>
      <p class="mt-1 text-xs text-text-muted">
        {{ billCount }} bill(s) · {{ formatToman(paidBillsTotal) }} paid ·
        {{ formatToman(unpaidBillsTotal) }} open
      </p>
    </article>

    <article class="rounded-3xl bg-surface p-5 text-text shadow-lg lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Expenses
      </p>
      <p class="mt-2 font-mono text-xl font-bold text-warning">{{ formatToman(monthExpenses) }}</p>
      <p class="mt-1 text-xs text-text-muted">{{ expenseCount }} purchase(s)</p>
    </article>

    <article class="rounded-3xl bg-surface p-5 text-text shadow-lg lg:col-span-3">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Net this month
      </p>
      <p class="mt-2 font-mono text-xl font-bold" :class="signedTextClasses[netTone]">
        {{ signed(monthNet) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">Deposits minus bills &amp; expenses</p>
    </article>

    <article class="rounded-3xl p-5 shadow-lg sm:col-span-2 lg:col-span-3" :class="balanceCardClasses[balanceTone]">
      <p class="text-xs font-medium uppercase tracking-wider opacity-80">Remaining balance</p>
      <p class="mt-2 font-mono text-xl font-bold">{{ formatToman(closingBalance) }}</p>
      <p class="mt-1 text-xs opacity-80">Carried in: {{ formatToman(openingBalance) }}</p>
    </article>
  </div>
</template>
