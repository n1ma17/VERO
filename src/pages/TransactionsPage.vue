<script setup lang="ts">
import PageHeader from '@/components/shared/PageHeader.vue'
import TransactionForm from '@/components/Transactions/TransactionForm.vue'
import TransactionList from '@/components/Transactions/TransactionList.vue'
</script>

<template>
  <PageHeader title="Transactions" subtitle="Add and manage your income and expenses" />
  <div class="space-y-6">
    <TransactionForm />
    <TransactionList />
  </div>
</template>
