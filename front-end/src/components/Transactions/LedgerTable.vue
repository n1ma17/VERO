<script setup lang="ts">
import { computed, ref } from 'vue'
import InstallmentStatusBadge from '@/components/shared/InstallmentStatusBadge.vue'
import { useLedger } from '@/composables/useLedger'
import type { LedgerEntryKind } from '@/types/ledger'
import { expenseCategories } from '@/utils/expenseCategories'
import { formatJalaliDate } from '@/utils/jalali'
import { formatToman } from '@/utils/formatToman'

type Filter = 'all' | LedgerEntryKind

const { entries, openingBalance, closingBalance, viewLabel, loading } = useLedger()

const filter = ref<Filter>('all')

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'bill', label: 'Bills' },
  { id: 'expense', label: 'Expenses' },
]

const visibleEntries = computed(() =>
  filter.value === 'all' ? entries.value : entries.value.filter((e) => e.kind === filter.value),
)

const filterClasses = {
  active: 'bg-primary text-background',
  idle: 'text-text-muted hover:bg-accent/50',
} as const

const kindBadgeClasses: Record<LedgerEntryKind, string> = {
  deposit: 'bg-success/15 text-success',
  bill: 'bg-danger/15 text-danger',
  expense: 'bg-warning/15 text-warning',
}

const kindLabels: Record<LedgerEntryKind, string> = {
  deposit: 'Deposit',
  bill: 'Bill',
  expense: 'Expense',
}

const amountClasses: Record<LedgerEntryKind, string> = {
  deposit: 'text-success',
  bill: 'text-danger',
  expense: 'text-warning',
}

function balanceClass(value: number) {
  return value < 0 ? 'text-danger' : 'text-text'
}
</script>

<template>
  <section class="min-w-0 overflow-hidden rounded-3xl bg-surface p-4 text-text shadow-lg sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold">Statement</h2>
        <p class="mt-0.5 text-xs text-text-muted">{{ viewLabel }}</p>
      </div>
      <div class="flex max-w-full gap-1 overflow-x-auto rounded-full border border-primary/20 p-1">
        <button
          v-for="option in filters"
          :key="option.id"
          type="button"
          class="shrink-0 rounded-full px-3 py-2 text-xs font-medium transition"
          :class="filter === option.id ? filterClasses.active : filterClasses.idle"
          @click="filter = option.id"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <ul class="mt-5 space-y-2 md:hidden">
      <li class="flex items-center justify-between gap-3 rounded-2xl bg-primary/10 px-3 py-3 text-sm text-text-muted">
        <span class="italic">Carried in</span>
        <span class="shrink-0 font-mono" :class="balanceClass(openingBalance)">
          {{ formatToman(openingBalance) }}
        </span>
      </li>
      <li
        v-for="entry in visibleEntries"
        :key="entry.id"
        class="rounded-2xl border border-primary/15 px-3 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-mono text-xs text-text-muted">
              {{ formatJalaliDate(entry.year, entry.month, entry.day) }}
            </p>
            <RouterLink
              v-if="entry.installmentId"
              :to="{ name: 'installment-detail', params: { id: entry.installmentId } }"
              class="mt-0.5 block truncate font-medium hover:underline"
            >
              {{ entry.title }}
            </RouterLink>
            <RouterLink
              v-else-if="entry.expenseId"
              :to="{ name: 'expense-entry', params: { id: entry.expenseId } }"
              class="mt-0.5 block truncate font-medium hover:underline"
            >
              {{ entry.title }}
            </RouterLink>
            <p v-else class="mt-0.5 truncate font-medium">{{ entry.title }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="kindBadgeClasses[entry.kind]"
              >
                {{ kindLabels[entry.kind] }}
              </span>
              <InstallmentStatusBadge v-if="entry.status" :status="entry.status" />
              <span
                v-if="entry.category"
                class="flex items-center gap-1.5 text-xs text-text-muted"
              >
                <span class="size-2 rounded-full" :class="expenseCategories[entry.category].dot" />
                {{ expenseCategories[entry.category].label }}
              </span>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-mono text-sm font-semibold" :class="amountClasses[entry.kind]">
              {{ entry.kind === 'deposit' ? '+' : '−' }}{{ formatToman(entry.amount) }}
            </p>
            <p class="mt-1 font-mono text-xs" :class="balanceClass(entry.balance)">
              {{ formatToman(entry.balance) }}
            </p>
          </div>
        </div>
      </li>
      <li v-if="!visibleEntries.length" class="py-6 text-center text-sm text-text-muted">
        {{ loading ? 'Loading statement…' : 'No entries for this month.' }}
      </li>
      <li class="flex items-center justify-between gap-3 px-3 pt-2 text-sm font-semibold">
        <span>Remaining</span>
        <span class="font-mono" :class="balanceClass(closingBalance)">
          {{ formatToman(closingBalance) }}
        </span>
      </li>
    </ul>

    <div class="mt-5 hidden overflow-x-auto md:block">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr
            class="border-b border-primary/20 text-xs uppercase tracking-wider text-text-muted"
          >
            <th class="py-2 pr-4 font-medium">Date</th>
            <th class="py-2 pr-4 font-medium">Description</th>
            <th class="py-2 pr-4 font-medium">Type</th>
            <th class="py-2 pr-4 text-right font-medium">Amount</th>
            <th class="py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-primary/15 text-text-muted">
            <td class="py-3 pr-4" />
            <td class="py-3 pr-4 italic" colspan="3">Carried in from previous months</td>
            <td class="py-3 text-right font-mono" :class="balanceClass(openingBalance)">
              {{ formatToman(openingBalance) }}
            </td>
          </tr>

          <tr
            v-for="entry in visibleEntries"
            :key="entry.id"
            class="border-b border-primary/15 transition hover:bg-primary/10"
          >
            <td class="whitespace-nowrap py-3 pr-4 font-mono text-xs">
              {{ formatJalaliDate(entry.year, entry.month, entry.day) }}
            </td>
            <td class="py-3 pr-4">
              <RouterLink
                v-if="entry.installmentId"
                :to="{ name: 'installment-detail', params: { id: entry.installmentId } }"
                class="font-medium hover:underline"
              >
                {{ entry.title }}
              </RouterLink>
              <RouterLink
                v-else-if="entry.expenseId"
                :to="{ name: 'expense-entry', params: { id: entry.expenseId } }"
                class="font-medium hover:underline"
              >
                {{ entry.title }}
              </RouterLink>
              <span v-else class="font-medium">{{ entry.title }}</span>
              <p v-if="entry.detail" class="text-xs text-text-muted">
                {{ entry.detail }}
              </p>
            </td>
            <td class="py-3 pr-4">
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                  :class="kindBadgeClasses[entry.kind]"
                >
                  {{ kindLabels[entry.kind] }}
                </span>
                <InstallmentStatusBadge v-if="entry.status" :status="entry.status" />
                <span
                  v-if="entry.category"
                  class="flex items-center gap-1.5 text-xs text-text-muted"
                >
                  <span class="size-2 rounded-full" :class="expenseCategories[entry.category].dot" />
                  {{ expenseCategories[entry.category].label }}
                </span>
              </div>
            </td>
            <td
              class="whitespace-nowrap py-3 pr-4 text-right font-mono font-semibold"
              :class="amountClasses[entry.kind]"
            >
              {{ entry.kind === 'deposit' ? '+' : '−' }}{{ formatToman(entry.amount) }}
            </td>
            <td class="whitespace-nowrap py-3 text-right font-mono" :class="balanceClass(entry.balance)">
              {{ formatToman(entry.balance) }}
            </td>
          </tr>

          <tr v-if="!visibleEntries.length">
            <td colspan="5" class="py-8 text-center text-text-muted">
              {{ loading ? 'Loading statement…' : 'No entries for this month.' }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-semibold">
            <td class="pt-4 pr-4" />
            <td class="pt-4 pr-4" colspan="3">Remaining balance</td>
            <td class="pt-4 text-right font-mono" :class="balanceClass(closingBalance)">
              {{ formatToman(closingBalance) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>
