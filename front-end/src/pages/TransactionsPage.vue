<script setup lang="ts">
import CashFlowChart from '@/components/Transactions/CashFlowChart.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import LedgerChart from '@/components/Transactions/LedgerChart.vue'
import LedgerCoverage from '@/components/Transactions/LedgerCoverage.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import LedgerSummaryCards from '@/components/Transactions/LedgerSummaryCards.vue'
import LedgerTable from '@/components/Transactions/LedgerTable.vue'
import RecentActivity from '@/components/Transactions/RecentActivity.vue'
import SpendingBreakdown from '@/components/Transactions/SpendingBreakdown.vue'
import UpcomingBills from '@/components/Transactions/UpcomingBills.vue'
</script>

<template>
  <PageHeader
    title="Transactions"
    subtitle="Deposits, bills, expenses and remaining balance by Jalali month"
  />
  <div class="min-w-0 space-y-6">
    <ViewMonthNavigator context="ledger" />
    <LedgerSummaryCards />
    <div class="grid min-w-0 gap-6 lg:grid-cols-3">
      <LedgerChart class="min-w-0 lg:col-span-2" />
      <LedgerCoverage />
    </div>
    <div class="grid min-w-0 gap-6 lg:grid-cols-3">
      <CashFlowChart class="min-w-0 lg:col-span-2" />
      <UpcomingBills />
    </div>
    <div class="grid min-w-0 gap-6 lg:grid-cols-2">
      <SpendingBreakdown />
      <RecentActivity class="min-w-0" />
    </div>
    <LedgerTable />
  </div>
</template>