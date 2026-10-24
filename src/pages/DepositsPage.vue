<script setup lang="ts">
import BankBalanceCard from '@/components/Deposits/BankBalanceCard.vue'
import DepositForm from '@/components/Deposits/DepositForm.vue'
import DepositList from '@/components/Deposits/DepositList.vue'
import DepositMonthNavigator from '@/components/Deposits/DepositMonthNavigator.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
</script>

<template>
  <PageHeader
    title="Deposits"
    subtitle="Bank date vs. counted month — browse past months with the navigator"
  />
  <div class="mx-auto max-w-lg space-y-6">
    <BankBalanceCard />
    <DepositMonthNavigator />
    <DepositForm />
    <DepositList />
  </div>
</template>
