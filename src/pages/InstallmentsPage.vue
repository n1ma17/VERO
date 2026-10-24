<script setup lang="ts">
import InstallmentList from '@/components/Installments/InstallmentList.vue'
import InstallmentMonthNavigator from '@/components/Installments/InstallmentMonthNavigator.vue'
import InstallmentSummary from '@/components/Installments/InstallmentSummary.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Installments"
    subtitle="Browse this month and upcoming months — tap a receipt for details and payment"
  />
  <div class="space-y-8">
    <InstallmentMonthNavigator />
    <InstallmentSummary />
    <InstallmentList />
  </div>
</template>
