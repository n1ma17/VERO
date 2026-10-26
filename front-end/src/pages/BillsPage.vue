<script setup lang="ts">
import BillDefinitionPrinter from '@/components/Bills/BillDefinitionPrinter.vue'
import BillDefinitionReceipt from '@/components/Bills/BillDefinitionReceipt.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
</script>

<template>
  <PageHeader
    title="Bills"
    subtitle="Define a bill for the selected month — duration becomes a start and end date"
  />
  <div class="min-w-0 space-y-8">
    <ViewMonthNavigator context="bills" />
    <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <BillDefinitionReceipt />
      <BillDefinitionPrinter />
    </div>
  </div>
</template>
