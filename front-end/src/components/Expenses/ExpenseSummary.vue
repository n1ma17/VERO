<script setup lang="ts">
import { computed } from 'vue'
import { useExpenses } from '@/composables/useExpenses'
import { expenseCategories } from '@/utils/expenseCategories'
import { formatToman, formatTomanNumber } from '@/utils/formatToman'

const { monthTotal, expensesInViewMonth, categoryTotals } = useExpenses()

const largest = computed(() => categoryTotals.value[0]?.amount ?? 0)

function barWidth(amount: number) {
  return largest.value > 0 ? (amount / largest.value) * 100 : 0
}

function share(amount: number) {
  return monthTotal.value > 0 ? Math.round((amount / monthTotal.value) * 100) : 0
}
</script>

<template>
  <section class="min-w-0 grid gap-6 overflow-hidden rounded-3xl bg-surface p-4 text-text sm:p-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
    <div class="md:border-r md:border-primary/20 md:pr-6">
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Spent this month
      </p>
      <p class="mt-2 font-mono text-2xl font-bold leading-tight text-warning sm:text-3xl">
        {{ formatTomanNumber(monthTotal) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-sm text-text-muted">
        {{ expensesInViewMonth.length }} purchase(s)
      </p>
    </div>

    <ul v-if="categoryTotals.length" class="space-y-3">
      <li
        v-for="item in categoryTotals"
        :key="item.category"
        class="grid gap-2 text-sm sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="size-2.5 shrink-0 rounded-full" :class="expenseCategories[item.category].dot" />
          <span class="truncate">{{ expenseCategories[item.category].label }}</span>
        </span>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" class="h-2 w-full min-w-0" aria-hidden="true">
          <rect width="100" height="6" rx="3" class="fill-primary/15/10" />
          <rect
            :width="barWidth(item.amount)"
            height="6"
            rx="3"
            :class="expenseCategories[item.category].fill"
          />
        </svg>
        <span class="font-mono text-xs sm:text-right">
          {{ formatToman(item.amount) }}
          <span class="text-text-muted">· {{ share(item.amount) }}%</span>
        </span>
      </li>
    </ul>
    <p v-else class="self-center text-sm text-text-muted">
      No purchases recorded for this month.
    </p>
  </section>
</template>
