<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import TransactionItem from '@/components/shared/TransactionItem.vue'
import { useTransactions } from '@/composables/useTransactions'

const RECENT_LIMIT = 5

const { transactions } = useTransactions()
const recent = computed(() => transactions.value.slice(0, RECENT_LIMIT))
</script>

<template>
  <BaseCard title="Recent transactions">
    <ul v-if="recent.length" class="divide-y divide-border">
      <TransactionItem v-for="item in recent" :key="item.id" :transaction="item" />
    </ul>
    <p v-else class="text-sm text-content-muted">
      No transactions yet.
      <RouterLink to="/transactions" class="font-medium text-primary hover:underline">
        Add one
      </RouterLink>
    </p>
  </BaseCard>
</template>
