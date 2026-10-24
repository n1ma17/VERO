<script setup lang="ts">
import CashFlowChart from '@/components/Dashboard/CashFlowChart.vue'
import DashboardDataBackup from '@/components/Dashboard/DashboardDataBackup.vue'
import DashboardHero from '@/components/Dashboard/DashboardHero.vue'
import DashboardKpis from '@/components/Dashboard/DashboardKpis.vue'
import RecentActivity from '@/components/Dashboard/RecentActivity.vue'
import SpendingBreakdown from '@/components/Dashboard/SpendingBreakdown.vue'
import UpcomingBills from '@/components/Dashboard/UpcomingBills.vue'
</script>

<template>
  <div class="space-y-6">
    <DashboardHero />
    <DashboardKpis />
    <div class="grid gap-6 lg:grid-cols-3">
      <CashFlowChart class="lg:col-span-2" />
      <UpcomingBills />
    </div>
    <div class="grid min-w-0 gap-6 lg:grid-cols-2">
      <SpendingBreakdown />
      <RecentActivity class="min-w-0" />
    </div>
    <DashboardDataBackup />
  </div>
</template>
