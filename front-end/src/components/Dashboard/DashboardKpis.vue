<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '@/composables/useDashboard'
import { formatToman, formatTomanNumber } from '@/utils/formatToman'

const {
  monthIncome,
  monthBills,
  monthExpenses,
  monthDepositCount,
  monthBillCount,
  monthExpenseCount,
  monthPaidCount,
  monthPaidAmount,
  overdueCount,
  overdueAmount,
} = useDashboard()

const RING_RADIUS = 22
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const paidRatio = computed(() =>
  monthBillCount.value > 0 ? monthPaidCount.value / monthBillCount.value : 0,
)
const ringDash = computed(
  () => `${paidRatio.value * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`,
)

const hasOverdue = computed(() => overdueCount.value > 0)

const overdueCardClasses = {
  alert: 'bg-danger text-background',
  clear: 'bg-surface text-text',
} as const

const staggerClasses = [
  '[animation-delay:60ms]',
  '[animation-delay:120ms]',
  '[animation-delay:180ms]',
  '[animation-delay:240ms]',
  '[animation-delay:300ms]',
] as const
</script>

<template>
  <div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-6">
    <article
      class="min-w-0 animate-fade-up rounded-3xl bg-surface p-4 text-text shadow-lg motion-reduce:animate-none sm:p-5 lg:col-span-2"
      :class="staggerClasses[0]"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
          Deposits
        </p>
        <span class="flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M17 7 7 17M7 17h8M7 17V9" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
      <p class="mt-3 font-mono text-xl font-bold leading-tight text-success sm:text-2xl">
        {{ formatTomanNumber(monthIncome) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-xs text-text-muted">
        {{ monthDepositCount }} deposit(s) this month
      </p>
    </article>

    <article
      class="min-w-0 animate-fade-up rounded-3xl bg-surface p-4 text-text shadow-lg motion-reduce:animate-none sm:p-5 lg:col-span-2"
      :class="staggerClasses[1]"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
          Bills
        </p>
        <span class="flex size-9 items-center justify-center rounded-xl bg-danger/15 text-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M7 17 17 7M17 7H9M17 7v8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
      <p class="mt-3 font-mono text-xl font-bold leading-tight text-danger sm:text-2xl">
        {{ formatTomanNumber(monthBills) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ monthBillCount }} bill(s) due this month</p>
    </article>

    <RouterLink
      to="/expenses"
      class="min-w-0 animate-fade-up rounded-3xl bg-surface p-4 text-text shadow-lg transition hover:-translate-y-0.5 motion-reduce:animate-none sm:col-span-2 sm:p-5 lg:col-span-2"
      :class="staggerClasses[2]"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
          Expenses
        </p>
        <span class="flex size-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="17" cy="20" r="1" />
          </svg>
        </span>
      </div>
      <p class="mt-3 font-mono text-xl font-bold leading-tight text-warning sm:text-2xl">
        {{ formatTomanNumber(monthExpenses) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-xs text-text-muted">{{ monthExpenseCount }} purchase(s) this month</p>
    </RouterLink>

    <article
      class="flex min-w-0 animate-fade-up items-center gap-4 rounded-3xl bg-surface p-4 text-text shadow-lg motion-reduce:animate-none sm:p-5 lg:col-span-3"
      :class="staggerClasses[3]"
    >
      <svg viewBox="0 0 56 56" class="size-14 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" :r="RING_RADIUS" fill="none" stroke-width="6" class="stroke-primary/20" />
        <circle
          v-if="paidRatio > 0"
          cx="28"
          cy="28"
          :r="RING_RADIUS"
          fill="none"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="ringDash"
          class="stroke-success transition-all duration-700"
        />
      </svg>
      <div class="min-w-0">
        <p class="text-xs font-medium uppercase tracking-wider text-text-muted">
          Bills paid
        </p>
        <p class="mt-1 text-2xl font-bold">
          {{ monthPaidCount }}<span class="text-base text-text-muted">/{{ monthBillCount }}</span>
        </p>
        <p class="mt-0.5 font-mono text-xs text-text-muted">
          {{ formatToman(monthPaidAmount) }}
        </p>
      </div>
    </article>

    <RouterLink
      to="/installments"
      class="min-w-0 animate-fade-up rounded-3xl p-4 shadow-lg transition hover:-translate-y-0.5 motion-reduce:animate-none sm:p-5 lg:col-span-3"
      :class="[overdueCardClasses[hasOverdue ? 'alert' : 'clear'], staggerClasses[4]]"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider opacity-75">Overdue</p>
        <span
          class="flex size-9 items-center justify-center rounded-xl"
          :class="hasOverdue ? 'bg-background/15' : 'bg-success/15 text-success'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4" aria-hidden="true">
            <path
              v-if="hasOverdue"
              d="M12 8v5M12 16.5v.5M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path v-else d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
      <template v-if="hasOverdue">
        <p class="mt-3 font-mono text-xl font-bold leading-tight sm:text-2xl">
          {{ formatTomanNumber(overdueAmount) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
        </p>
        <p class="mt-1 text-xs opacity-80">{{ overdueCount }} installment(s) past due — review now</p>
      </template>
      <template v-else>
        <p class="mt-3 text-2xl font-bold">All caught up</p>
        <p class="mt-1 text-xs text-text-muted">No installments past due</p>
      </template>
    </RouterLink>
  </div>
</template>
