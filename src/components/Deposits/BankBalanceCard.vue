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
    class="mb-0 overflow-visible rounded-3xl px-2 pb-2 pt-8 sm:px-6 sm:pt-10 md:px-8"
    aria-label="Bank balance card"
  >
    <div class="flex min-w-0 items-baseline justify-center gap-2 px-2 sm:gap-3">
      <p class="break-all text-3xl font-extrabold tracking-tight text-accent sm:text-5xl md:text-6xl">
        {{ balanceNumber }}
      </p>
      <span class="shrink-0 text-sm font-semibold text-primary">Toman</span>
    </div>

    <div class="mt-[-28px] overflow-visible sm:mt-[-36px] md:mt-[-40px]">
      <BankCardPlastic />
    </div>
  </article>
</template>
