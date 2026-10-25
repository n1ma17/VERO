<script setup lang="ts">
import BankBalanceCard from '@/components/Deposits/BankBalanceCard.vue'
import DepositForm from '@/components/Deposits/DepositForm.vue'
import DepositList from '@/components/Deposits/DepositList.vue'
import ViewMonthNavigator from '@/components/shared/ViewMonthNavigator.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Deposits"
    subtitle="Bank date vs. counted month — browse past months with the navigator"
  />
  <div class="space-y-8">
    <BankBalanceCard />
    <ViewMonthNavigator context="deposits" />
    <div class="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <DepositForm />
      <DepositList />
    </div>
  </div>
</template>
