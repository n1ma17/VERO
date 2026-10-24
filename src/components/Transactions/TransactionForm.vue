<script setup lang="ts">
import { computed, reactive } from 'vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseCard from '@/components/shared/BaseCard.vue'
import { useTransactions } from '@/composables/useTransactions'
import type { TransactionType } from '@/types/transaction'

const { addTransaction } = useTransactions()

const form = reactive({
  title: '',
  amount: null as number | null,
  type: 'expense' as TransactionType,
})

const isValid = computed(() => form.title.trim() !== '' && (form.amount ?? 0) > 0)

function submit() {
  if (!isValid.value) return
  addTransaction({ title: form.title.trim(), amount: form.amount!, type: form.type })
  form.title = ''
  form.amount = null
}

const inputClasses =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft'
</script>

<template>
  <BaseCard title="Add transaction">
    <form class="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]" @submit.prevent="submit">
      <input v-model="form.title" type="text" placeholder="Title" :class="inputClasses" />
      <input
        v-model.number="form.amount"
        type="number"
        min="0"
        step="0.01"
        placeholder="Amount"
        :class="inputClasses"
      />
      <select v-model="form.type" :class="inputClasses">
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <BaseButton type="submit" :disabled="!isValid">Add</BaseButton>
    </form>
  </BaseCard>
</template>
