<script setup lang="ts">
import ExpenseList from '@/components/Expenses/ExpenseList.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import ExpenseSummary from '@/components/Expenses/ExpenseSummary.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <PageHeader title="Expenses" subtitle="Everyday purchases by month — tap a receipt to edit it" />
    <RouterLink
      :to="{ name: 'expense-entry' }"
      class="rounded-[16px] bg-accent px-5 py-2.5 text-sm font-semibold text-text transition hover:bg-accent mb-3 md:mb-0"
    >
      Add expense
    </RouterLink>
  </div>
  <div class="space-y-8">
    <ViewMonthNavigator context="expenses" />
    <ExpenseSummary />
    <ExpenseList />
  </div>
</template>
