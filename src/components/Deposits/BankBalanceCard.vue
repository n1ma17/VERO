<script setup lang="ts">
import { computed } from 'vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { formatJalaliMonth } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const { totalBalance, currentMonthTotal, calendarMonth } = useBankDeposits()

const monthLabel = computed(() =>
  formatJalaliMonth(calendarMonth.value.year, calendarMonth.value.month),
)

const balanceLabel = computed(() => formatToman(totalBalance.value))
const monthDepositsLabel = computed(() => formatToman(currentMonthTotal.value))
</script>

<template>
  <article
    class="relative overflow-hidden rounded-3xl bg-linear-to-br from-bank-card-from via-primary to-bank-card-to p-6 text-on-primary shadow-xl"
    aria-label="Bank balance card"
  >
    <div
      class="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-bank-card-shine/20"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-12 -left-6 size-48 rounded-full bg-bank-card-shine/10"
      aria-hidden="true"
    />

    <div class="relative flex items-start justify-between gap-4">
      <p class="text-xs font-medium uppercase tracking-[0.2em] text-content/80">Money Management</p>
      <span
        class="rounded-md bg-bank-card-chip/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-content-on-surface"
      >
        Debit
      </span>
    </div>

    <div
      class="relative mt-6 h-9 w-12 rounded-md bg-linear-to-br from-bank-card-chip to-accent shadow-inner"
      aria-hidden="true"
    />

    <p class="relative mt-8 font-mono text-sm tracking-[0.35em] text-content/90">•••• •••• •••• 4821</p>

    <div class="relative mt-8">
      <p class="text-xs text-content/75">Total balance</p>
      <p class="mt-1 text-3xl font-bold tracking-tight">{{ balanceLabel }}</p>
    </div>

    <div
      class="relative mt-6 flex items-end justify-between gap-4 border-t border-content/15 pt-4 text-sm"
    >
      <div>
        <p class="text-xs text-content/70">Counted this month</p>
        <p class="font-medium">{{ monthLabel }}</p>
      </div>
      <p class="font-mono text-lg font-semibold">{{ monthDepositsLabel }}</p>
    </div>
  </article>
</template>
