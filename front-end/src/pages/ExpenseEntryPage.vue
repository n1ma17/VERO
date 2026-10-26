<script setup lang="ts">
import ExpenseEntryForm from '@/components/ExpenseEntry/ExpenseEntryForm.vue'
import ExpensePrinter from '@/components/ExpenseEntry/ExpensePrinter.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Record expense"
    subtitle="Purchases like food, clothes or fun — deducted from the month of the purchase date"
  />
  <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
    <ExpenseEntryForm />
    <ExpensePrinter />
  </div>
</template>
