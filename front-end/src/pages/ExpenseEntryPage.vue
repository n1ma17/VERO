<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageBackLink from '@/components/shared/PageBackLink.vue'
import ExpenseEntryForm from '@/components/ExpenseEntry/ExpenseEntryForm.vue'
import ExpensePrinter from '@/components/ExpenseEntry/ExpensePrinter.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const route = useRoute()

const isEditing = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0
})
</script>

<template>
  <div class="min-w-0 space-y-6">
    <PageBackLink :to="{ name: 'expenses' }" label="Back to expenses" />
    <PageHeader
      :title="isEditing ? 'Edit expense' : 'Record expense'"
      subtitle="Purchases like food, clothes or fun — deducted from the month of the purchase date"
    />
    <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <ExpenseEntryForm />
      <ExpensePrinter />
    </div>
  </div>
</template>
