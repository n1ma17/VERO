<script setup lang="ts">
import { computed } from 'vue'
import ExpenseReceiptCard from '@/components/Expenses/ExpenseReceiptCard.vue'
import { useExpenses } from '@/composables/useExpenses'
import { formatJalaliMonth } from '@/utils/jalali'

const { expensesInViewMonth, viewMonth } = useExpenses()

const monthLabel = computed(() => formatJalaliMonth(viewMonth.value.year, viewMonth.value.month))
</script>

<template>
  <div v-if="expensesInViewMonth.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <ExpenseReceiptCard v-for="expense in expensesInViewMonth" :key="expense.id" :expense="expense" />
  </div>
  <div
    v-else
    class="rounded-3xl border border-dashed border-content/20 px-6 py-12 text-center text-content-muted"
  >
    <p>No expenses in {{ monthLabel }}.</p>
    <RouterLink
      :to="{ name: 'expense-entry' }"
      class="mt-2 inline-block font-medium text-content hover:underline"
    >
      Record a purchase
    </RouterLink>
  </div>
</template>
