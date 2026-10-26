<script setup lang="ts">
import BackToInstallments from '@/components/InstallmentDetail/BackToInstallments.vue'
import InstallmentPrinter from '@/components/InstallmentDetail/InstallmentPrinter.vue'
import InstallmentReceipt from '@/components/InstallmentDetail/InstallmentReceipt.vue'
import InstallmentStatusActions from '@/components/InstallmentDetail/InstallmentStatusActions.vue'
</script>

<template>
  <div class="min-w-0 space-y-6">
    <BackToInstallments />
    <div class="grid min-w-0 items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <div class="space-y-6">
        <InstallmentReceipt />
        <InstallmentStatusActions />
      </div>
      <InstallmentPrinter />
    </div>
  </div>
</template>
