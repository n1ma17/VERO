<script setup lang="ts">
import BaseCard from '@/components/shared/BaseCard.vue'
import TransactionItem from '@/components/shared/TransactionItem.vue'
import { useTransactions } from '@/composables/useTransactions'

const { transactions, removeTransaction } = useTransactions()
</script>

<template>
  <BaseCard title="All transactions">
    <ul v-if="transactions.length" class="divide-y divide-border">
      <TransactionItem
        v-for="item in transactions"
        :key="item.id"
        :transaction="item"
        removable
        @remove="removeTransaction"
      />
    </ul>
    <p v-else class="text-sm text-content-muted">No transactions yet.</p>
  </BaseCard>
</template>
