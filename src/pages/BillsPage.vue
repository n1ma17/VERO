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
  <div class="grid items-start gap-10 lg:grid-cols-2">
    <BillDefinitionReceipt />
    <BillDefinitionPrinter />
  </div>
</template>
