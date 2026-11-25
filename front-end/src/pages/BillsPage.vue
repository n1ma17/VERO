<script setup lang="ts">
import BillList from '@/components/Bills/BillList.vue'
import BillsPageHeader from '@/components/Bills/BillsPageHeader.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
</script>

<template>
  <BillsPageHeader />
  <div class="min-w-0 space-y-8">
    <ViewMonthNavigator context="bills" />
    <BillList />
  </div>
</template>