<script setup lang="ts">
import BillList from '@/components/Bills/BillList.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Bills"
    subtitle="Recurring charges by month — tap a bill to edit or define a new one"
  >
    <template #actions>
      <RouterLink
        :to="{ name: 'bill-entry' }"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent/90 sm:w-auto"
      >
        Define bill
      </RouterLink>
    </template>
  </PageHeader>
  <div class="min-w-0 space-y-8">
    <ViewMonthNavigator context="bills" />
    <BillList />
  </div>
</template>
