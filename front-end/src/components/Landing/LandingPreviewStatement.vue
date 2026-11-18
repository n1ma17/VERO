<script setup lang="ts">
import { formatTomanNumber } from '@/utils/formatToman'

type Kind = 'deposit' | 'bill' | 'expense'

const kindLabels: Record<Kind, string> = {
  deposit: 'Deposit',
  bill: 'Bill',
  expense: 'Expense',
}

const openingBalance = 15_270_000

const entries: { date: string; title: string; detail?: string; kind: Kind; amount: number }[] = [
  { date: '01 Aban', title: 'Salary', kind: 'deposit', amount: 42_000_000 },
  { date: '03 Aban', title: 'Rent', detail: 'Installment 8 of 12', kind: 'bill', amount: 18_500_000 },
  { date: '06 Aban', title: 'Groceries', kind: 'expense', amount: 2_340_000 },
  { date: '12 Aban', title: 'Car loan', detail: 'Installment 14 of 36', kind: 'bill', amount: 9_800_000 },
  { date: '15 Aban', title: 'Freelance invoice', kind: 'deposit', amount: 6_500_000 },
  { date: '24 Aban', title: 'Fuel', kind: 'expense', amount: 1_150_000 },
  { date: '26 Aban', title: 'Dinner out', kind: 'expense', amount: 3_560_000 },
]

let running = openingBalance
const rows = entries.map((entry) => {
  running += entry.kind === 'deposit' ? entry.amount : -entry.amount
  return { ...entry, balance: running }
})
const closingBalance = running
</script>

<template>
  <div class="min-w-0">
    <div class="flex items-baseline justify-between">
      <h2 class="font-display text-2xl font-extrabold tracking-tight">Statement</h2>
      <p class="text-xs uppercase tracking-[0.18em]">Aban 1405</p>
    </div>

    <table class="mt-5 w-full text-left text-sm tabular-nums">
      <thead>
        <tr class="border-b border-text/30 text-xs uppercase tracking-[0.12em]">
          <th class="py-2 pr-3 font-medium">Date</th>
          <th class="py-2 pr-3 font-medium">Description</th>
          <th class="hidden py-2 pr-3 font-medium sm:table-cell">Type</th>
          <th class="py-2 text-right font-medium sm:pr-3">Amount</th>
          <th class="hidden py-2 text-right font-medium sm:table-cell">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-text/20">
          <td class="py-3 pr-3" />
          <td class="py-3 pr-3 italic">Carried in</td>
          <td class="hidden py-3 pr-3 sm:table-cell" />
          <td class="py-3 text-right sm:pr-3">
            <span class="sm:hidden">{{ formatTomanNumber(openingBalance) }}</span>
          </td>
          <td class="hidden py-3 text-right sm:table-cell">{{ formatTomanNumber(openingBalance) }}</td>
        </tr>
        <tr v-for="row in rows" :key="row.date + row.title" class="border-b border-text/20">
          <td class="whitespace-nowrap py-3 pr-3 text-xs">{{ row.date }}</td>
          <td class="py-3 pr-3">
            <span class="font-medium">{{ row.title }}</span>
            <span v-if="row.detail" class="block text-xs">{{ row.detail }}</span>
          </td>
          <td class="hidden py-3 pr-3 text-xs uppercase tracking-wide sm:table-cell">
            {{ kindLabels[row.kind] }}
          </td>
          <td class="whitespace-nowrap py-3 text-right font-medium sm:pr-3">
            {{ row.kind === 'deposit' ? '+' : '−' }}{{ formatTomanNumber(row.amount) }}
          </td>
          <td class="hidden whitespace-nowrap py-3 text-right sm:table-cell">
            {{ formatTomanNumber(row.balance) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="font-semibold">
          <td class="pt-4 pr-3" />
          <td class="pt-4 pr-3">Remaining</td>
          <td class="hidden pt-4 pr-3 sm:table-cell" />
          <td class="pt-4 text-right sm:pr-3">
            <span class="sm:hidden">{{ formatTomanNumber(closingBalance) }}</span>
          </td>
          <td class="hidden pt-4 text-right sm:table-cell">{{ formatTomanNumber(closingBalance) }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
