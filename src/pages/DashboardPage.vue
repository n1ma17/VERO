<script setup lang="ts">
import RecentTransactions from '@/components/Dashboard/RecentTransactions.vue'
import SummaryCards from '@/components/Dashboard/SummaryCards.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader title="Dashboard" subtitle="Overview of your money" />
  <div class="space-y-6">
    <SummaryCards />
    <RecentTransactions />
  </div>
</template>
