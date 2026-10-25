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
  <div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-6">
    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Deposits
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-success sm:text-xl">
        {{ formatToman(monthIncome) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ depositCount }} deposit(s) counted</p>
    </article>

    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Bills
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-danger sm:text-xl">
        {{ formatToman(monthBills) }}
      </p>
      <p class="mt-1 text-xs leading-snug text-text-muted">
        {{ billCount }} bill(s) · {{ formatToman(paidBillsTotal) }} paid ·
        {{ formatToman(unpaidBillsTotal) }} open
      </p>
    </article>

    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Expenses
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-warning sm:text-xl">
        {{ formatToman(monthExpenses) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ expenseCount }} purchase(s)</p>
    </article>

    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-3">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Net this month
      </p>
      <p
        class="mt-2 break-words font-mono text-lg font-bold leading-tight sm:text-xl"
        :class="signedTextClasses[netTone]"
      >
        {{ signed(monthNet) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">Deposits minus bills &amp; expenses</p>
    </article>

    <article
      class="min-w-0 rounded-3xl p-4 shadow-lg sm:col-span-2 sm:p-5 lg:col-span-3"
      :class="balanceCardClasses[balanceTone]"
    >
      <p class="text-xs font-medium uppercase tracking-wider opacity-80">Remaining balance</p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight sm:text-xl">
        {{ formatToman(closingBalance) }}
      </p>
      <p class="mt-1 text-xs opacity-80">Carried in: {{ formatToman(openingBalance) }}</p>
    </article>
  </div>
</template>
