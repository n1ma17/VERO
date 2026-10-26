<script setup lang="ts">
import InstallmentList from '@/components/Installments/InstallmentList.vue'
import InstallmentsDefineBillAction from '@/components/Installments/InstallmentsDefineBillAction.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import InstallmentSummary from '@/components/Installments/InstallmentSummary.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Installments"
    subtitle="Browse this month and upcoming months — tap a receipt for details and payment"
  >
    <template #actions>
      <InstallmentsDefineBillAction />
    </template>
  </PageHeader>
  <div class="space-y-8">
    <ViewMonthNavigator context="installments" />
    <InstallmentSummary />
    <InstallmentList />
  </div>
</template>
