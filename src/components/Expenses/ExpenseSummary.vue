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
  <section class="grid gap-6 rounded-3xl bg-surface p-6 text-text md:grid-cols-[14rem_1fr]">
    <div class="md:border-r md:border-primary/20 md:pr-6">
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Spent this month
      </p>
      <p class="mt-2 whitespace-nowrap font-mono text-3xl font-bold text-warning">
        {{ formatTomanNumber(monthTotal) }}<span class="ml-1 font-sans text-xs font-medium">Toman</span>
      </p>
      <p class="mt-1 text-sm text-text-muted">
        {{ expensesInViewMonth.length }} purchase(s)
      </p>
    </div>

    <ul v-if="categoryTotals.length" class="space-y-3">
      <li v-for="item in categoryTotals" :key="item.category" class="grid grid-cols-[8rem_1fr_10.5rem] items-center gap-3 text-sm">
        <span class="flex items-center gap-2 truncate">
          <span class="size-2.5 shrink-0 rounded-full" :class="expenseCategories[item.category].dot" />
          {{ expenseCategories[item.category].label }}
        </span>
        <svg viewBox="0 0 100 6" preserveAspectRatio="none" class="h-2 w-full" aria-hidden="true">
          <rect width="100" height="6" rx="3" class="fill-primary/15/10" />
          <rect
            :width="barWidth(item.amount)"
            height="6"
            rx="3"
            :class="expenseCategories[item.category].fill"
          />
        </svg>
        <span class="whitespace-nowrap text-right font-mono text-xs">
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
