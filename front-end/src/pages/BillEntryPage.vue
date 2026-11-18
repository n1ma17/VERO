<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageBackLink from '@/components/shared/PageBackLink.vue'
import BillDefinitionPrinter from '@/components/Bills/BillDefinitionPrinter.vue'
import BillDefinitionReceipt from '@/components/Bills/BillDefinitionReceipt.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const route = useRoute()

const isEditing = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0
})
</script>

<template>
  <div class="min-w-0 space-y-6">
    <PageBackLink :to="{ name: 'bills' }" label="Back to bills" />
    <PageHeader
      :title="isEditing ? 'Edit bill' : 'Define bill'"
      subtitle="Duration becomes a start and end date — installments appear on the Due tab"
    />
    <ViewMonthNavigator context="bills" />
    <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <BillDefinitionReceipt />
      <BillDefinitionPrinter />
    </div>
  </div>
</template>
