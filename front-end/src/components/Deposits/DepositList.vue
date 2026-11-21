<script setup lang="ts">
import { computed } from 'vue'
import DepositWallet from '@/components/Deposits/DepositWallet.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { formatCalendarMonth } from '@/utils/calendar'

const { depositsInViewMonth, viewMonth } = useBankDeposits()

const monthLabel = computed(() =>
  formatCalendarMonth(viewMonth.value.year, viewMonth.value.month),
)
</script>

<template>
  <section class="min-w-0 text-text">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-lg font-semibold">Deposits</h2>
      <span class="text-sm text-text-muted">{{ monthLabel }}</span>
    </div>

    <DepositWallet v-if="depositsInViewMonth.length" class="mt-5" />

    <p v-else class="mt-5 text-center text-sm text-text-muted">
      No deposits counted in this month. Use Prev to browse earlier months.
    </p>
  </section>
</template>
