<script setup lang="ts">
import AppMoneyMark from '@/components/shared/AppMoneyMark.vue'
import type { BankDeposit } from '@/types/bankDeposit'
import { formatCalendarDate, formatCalendarMonth } from '@/utils/calendar'
import { formatMoney } from '@/utils/formatMoney'

defineProps<{
  deposit: BankDeposit
  tone: 'sky' | 'mint' | 'peach' | 'lilac' | 'rose'
  editing: boolean
}>()

const toneClasses = {
  sky: 'bg-deposit-card-sky text-deposit-wallet-ink',
  mint: 'bg-deposit-card-mint text-deposit-wallet-ink',
  peach: 'bg-deposit-card-peach text-deposit-card-ink-blue',
  lilac: 'bg-deposit-card-lilac text-deposit-wallet-ink',
  rose: 'bg-deposit-card-rose text-deposit-wallet-ink',
}
</script>

<template>
  <div
    class="flex h-52 flex-col rounded-[1rem] px-6 pt-4 pb-5"
    :class="[toneClasses[tone], editing ? 'ring-2 ring-accent' : '']"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="truncate pt-1 text-lg leading-6 font-extrabold tracking-wide uppercase">
        {{ deposit.note || 'Deposit' }}
      </span>
      <AppMoneyMark />
    </div>

    <p class="flex flex-1 items-center justify-center font-display text-2xl font-bold tabular-nums">
      {{ formatMoney(deposit.amount) }}
    </p>

    <div class="flex items-end justify-between gap-3 text-xs opacity-80">
      <span>{{ formatCalendarDate(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay) }}</span>
      <span>Counted in {{ formatCalendarMonth(deposit.bookedYear, deposit.bookedMonth) }}</span>
    </div>
  </div>
</template>
