<script setup lang="ts">
import ExpenseList from '@/components/Expenses/ExpenseList.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import ExpenseSummary from '@/components/Expenses/ExpenseSummary.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader title="Expenses" subtitle="Everyday purchases by month — tap a receipt to edit it">
    <template #actions>
      <RouterLink
        :to="{ name: 'expense-entry' }"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] bg-accent px-5 py-2.5 text-sm font-semibold text-text transition hover:bg-accent sm:w-auto"
      >
        Add expense
      </RouterLink>
    </template>
  </PageHeader>
  <div class="min-w-0 space-y-8">
    <ViewMonthNavigator context="expenses" />
    <ExpenseSummary />
    <ExpenseList />
  </div>
</template>
