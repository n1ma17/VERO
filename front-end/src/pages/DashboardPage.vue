<script setup lang="ts">
import DashboardDataBackup from '@/components/Dashboard/DashboardDataBackup.vue'
import DashboardHero from '@/components/Dashboard/DashboardHero.vue'
import DashboardKpis from '@/components/Dashboard/DashboardKpis.vue'
</script>

<template>
  <div class="min-w-0 space-y-6">
    <DashboardHero />
    <DashboardKpis />
    <DashboardDataBackup />
  </div>
</template>