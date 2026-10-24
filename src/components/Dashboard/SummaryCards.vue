<script setup lang="ts">
import SummaryCard from '@/components/Dashboard/SummaryCard.vue'
import { useTransactions } from '@/composables/useTransactions'

const { balance, totalIncome, totalExpense } = useTransactions()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <SummaryCard label="Balance" :amount="balance" tone="primary" />
    <SummaryCard label="Income" :amount="totalIncome" tone="success" />
    <SummaryCard label="Expense" :amount="totalExpense" tone="danger" />
  </div>
</template>
