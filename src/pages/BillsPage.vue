<script setup lang="ts">
import BillDefinitionPrinter from '@/components/Bills/BillDefinitionPrinter.vue'
import BillDefinitionReceipt from '@/components/Bills/BillDefinitionReceipt.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Bills"
    subtitle="Define or edit a bill — installments update on this device"
  />
  <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
    <BillDefinitionReceipt />
    <BillDefinitionPrinter />
  </div>
</template>
