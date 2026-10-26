<script setup lang="ts">
import { computed } from 'vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import type { Expense } from '@/types/expense'
import { expenseCategories } from '@/utils/expenseCategories'
import { formatJalaliDate } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

const props = defineProps<{
  expense: Expense
}>()

const category = computed(() => expenseCategories[props.expense.category])
const date = computed(() =>
  formatJalaliDate(props.expense.jalaliYear, props.expense.jalaliMonth, props.expense.jalaliDay),
)
</script>

<template>
  <RouterLink
    :to="{ name: 'expense-entry', params: { id: expense.id } }"
    class="relative block overflow-hidden rounded-t-3xl bg-surface pb-5 text-text  outline-none transition duration-200 hover:-translate-y-1  focus-visible:ring-4 focus-visible:ring-accent"
  >
    <div class="h-1.5" :class="category.strip" />

    <header class="flex items-start gap-3 px-4 pb-4 pt-5 sm:px-6">
      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
        :class="category.tile"
      >
        {{ category.label.slice(0, 1) }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
          {{ category.label }}
        </p>
        <h3 class="mt-1 truncate text-lg font-semibold">{{ expense.title }}</h3>
      </div>
      <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-text-muted">
        Edit
      </span>
    </header>

    <ReceiptDivider />

    <dl class="space-y-2 px-4 pt-4 font-mono text-sm sm:px-6">
      <div class="flex justify-between gap-4">
        <dt class="text-text-muted">Date</dt>
        <dd>{{ date }}</dd>
      </div>
      <div v-if="expense.note" class="flex justify-between gap-4">
        <dt class="text-text-muted">Note</dt>
        <dd class="truncate text-right">{{ expense.note }}</dd>
      </div>
      <div class="flex items-baseline justify-between pt-2">
        <dt class="text-text-muted">Amount</dt>
        <dd class="text-xl font-bold">{{ formatToman(expense.amount) }}</dd>
      </div>
    </dl>

    <ReceiptEdge />
  </RouterLink>
</template>
