<script setup lang="ts">
import { computed } from 'vue'
import BankCardPlastic from '@/components/Deposits/BankCardPlastic.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { formatTomanNumber } from '@/utils/formatToman'

const { totalBalance } = useBankDeposits()

const balanceNumber = computed(() => formatTomanNumber(totalBalance.value))
</script>

<template>
  <article
    class="rounded-3xl px-4 pb-0 mb-0 pt-10 sm:px-8"
    aria-label="Bank balance card"
  >
    <div class="flex items-baseline justify-center gap-2 sm:gap-3">
      <p class="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl">
        {{ balanceNumber }}
      </p>
      <span class="text-sm font-semibold text-primary sm:text-sm">Toman</span>
    </div>

    <div class="mt-[-40px] overflow-visible ">
      <BankCardPlastic />
    </div>
  </article>
</template>
