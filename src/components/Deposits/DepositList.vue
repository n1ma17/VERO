<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import type { BankDeposit } from '@/types/bankDeposit'
import { formatJalaliDate, formatJalaliMonth } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const { depositsInViewMonth, viewMonth, editingDepositId, startEditingDeposit, removeDeposit } =
  useBankDeposits()

const monthLabel = computed(() =>
  formatJalaliMonth(viewMonth.value.year, viewMonth.value.month),
)

function remove(id: string) {
  removeDeposit(id)
}

function bankDateLabel(deposit: BankDeposit) {
  return formatJalaliDate(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay)
}

function showsDifferentBankMonth(deposit: BankDeposit) {
  return (
    deposit.jalaliYear !== deposit.bookedYear || deposit.jalaliMonth !== deposit.bookedMonth
  )
}
</script>

<template>
  <section class="min-w-0 overflow-hidden rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-6">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="text-lg font-semibold">Deposits</h2>
      <span class="text-sm text-text-muted">{{ monthLabel }}</span>
    </div>

    <ul v-if="depositsInViewMonth.length" class="mt-5 space-y-3">
      <li
        v-for="deposit in depositsInViewMonth"
        :key="deposit.id"
        class="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center"
        :class="
          editingDepositId === deposit.id
            ? 'border-accent bg-accent/25'
            : 'border-primary/20 bg-primary/10'
        "
      >
        <div class="min-w-0 flex-1">
          <p class="font-mono font-semibold text-success">{{ formatToman(deposit.amount) }}</p>
          <p v-if="deposit.note" class="mt-0.5 truncate text-sm text-text-muted">
            {{ deposit.note }}
          </p>
          <p class="mt-0.5 text-xs text-text-muted">
            Bank date: {{ bankDateLabel(deposit) }}
          </p>
          <p
            v-if="showsDifferentBankMonth(deposit)"
            class="mt-0.5 text-xs text-text-muted"
          >
            Counted in {{ formatJalaliMonth(deposit.bookedYear, deposit.bookedMonth) }}
          </p>
        </div>
        <div class="flex shrink-0 flex-col gap-1 sm:flex-row">
          <BaseButton type="button" variant="ghost" @click="startEditingDeposit(deposit.id)">
            Edit
          </BaseButton>
          <BaseButton type="button" variant="ghost" @click="remove(deposit.id)">Remove</BaseButton>
        </div>
      </li>
    </ul>

    <p v-else class="mt-5 text-center text-sm text-text-muted">
      No deposits counted in this month. Use Previous to browse earlier months.
    </p>
  </section>
</template>
