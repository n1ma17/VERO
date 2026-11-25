<script setup lang="ts">
import InstallmentCompanyBreakdown from '@/components/Installments/InstallmentCompanyBreakdown.vue'
import InstallmentList from '@/components/Installments/InstallmentList.vue'
import InstallmentsPageHeader from '@/components/Installments/InstallmentsPageHeader.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
</script>

<template>
  <InstallmentsPageHeader />
  <div class="min-w-0 space-y-8">
    <ViewMonthNavigator context="installments" />
    <InstallmentCompanyBreakdown />
    <InstallmentList />
  </div>
</template>