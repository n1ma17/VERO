<script setup lang="ts">
import { computed } from 'vue'
import { useLedger } from '@/composables/useLedger'
import { formatMoney } from '@/utils/formatMoney'

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

const netCardClasses = {
  positive: 'border border-stamp-approved/40 bg-stamp-approved/15',
  negative: 'border border-status-overdue/40 bg-status-overdue/15',
  zero: 'border border-status-paid/40 bg-status-paid/15',
} as const

const signedTextClasses = {
  positive: 'text-stamp-approved',
  negative: 'text-status-overdue',
  zero: 'text-status-paid',
} as const

const balanceCardClasses = {
  positive: 'bg-success text-on-accent',
  negative: 'bg-danger text-foreground',
} as const

const netTone = computed(() => {
  if (monthNet.value < 0) return 'negative'
  if (monthNet.value > 0) return 'positive'
  return 'zero'
})
const balanceTone = computed(() => (closingBalance.value < 0 ? 'negative' : 'positive'))

function signed(value: number) {
  return value > 0 ? `+${formatMoney(value)}` : formatMoney(value)
}
</script>

<template>
  <div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-6">
    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Deposits
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-success sm:text-xl">
        {{ formatMoney(monthIncome) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ depositCount }} deposit(s) counted</p>
    </article>

    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Bills
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-danger sm:text-xl">
        {{ formatMoney(monthBills) }}
      </p>
      <p class="mt-1 text-xs leading-snug text-text-muted">
        {{ billCount }} bill(s) · {{ formatMoney(paidBillsTotal) }} paid ·
        {{ formatMoney(unpaidBillsTotal) }} open
      </p>
    </article>

    <article class="min-w-0 rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-5 lg:col-span-2">
      <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
        Expenses
      </p>
      <p class="mt-2 break-words font-mono text-lg font-bold leading-tight text-warning sm:text-xl">
        {{ formatMoney(monthExpenses) }}
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ expenseCount }} purchase(s)</p>
    </article>

    <article
      class="min-w-0 rounded-3xl p-4 text-text shadow-lg sm:p-5 lg:col-span-3"
      :class="netCardClasses[netTone]"
    >
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
        {{ formatMoney(closingBalance) }}
      </p>
      <p class="mt-1 text-xs opacity-80">Carried in: {{ formatMoney(openingBalance) }}</p>
    </article>
  </div>
</template>
