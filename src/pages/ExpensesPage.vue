<script setup lang="ts">
import ExpenseList from '@/components/Expenses/ExpenseList.vue'
import ExpenseMonthNavigator from '@/components/Expenses/ExpenseMonthNavigator.vue'
import ExpenseSummary from '@/components/Expenses/ExpenseSummary.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <PageHeader title="Expenses" subtitle="Everyday purchases by month — tap a receipt to edit it" />
    <RouterLink
      :to="{ name: 'expense-entry' }"
      class="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-content-on-surface transition hover:bg-accent-hover"
    >
      Add expense
    </RouterLink>
  </div>
  <div class="space-y-8">
    <ExpenseMonthNavigator />
    <ExpenseSummary />
    <ExpenseList />
  </div>
</template>
