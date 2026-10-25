<script setup lang="ts">
import { useDashboard, type ActivityItem } from '@/composables/useDashboard'
import { expenseCategories } from '@/utils/expenseCategories'
import { formatToman } from '@/utils/formatToman'

const { recentActivity } = useDashboard()

function dotClass(item: ActivityItem) {
  return item.category ? expenseCategories[item.category].dot : 'bg-success'
}

function subtitle(item: ActivityItem) {
  return item.category
    ? `${expenseCategories[item.category].label} · ${item.dateLabel}`
    : `Deposit · ${item.dateLabel}`
}
</script>

<template>
  <section
    class="flex min-w-0 animate-fade-up flex-col overflow-hidden rounded-3xl bg-surface p-6 text-text shadow-lg [animation-delay:480ms] motion-reduce:animate-none"
  >
    <div class="flex items-baseline justify-between">
      <h2 class="text-lg font-semibold">Recent activity</h2>
      <div class="flex gap-3 text-xs font-medium">
        <RouterLink to="/deposits" class="text-primary hover:underline">Deposits</RouterLink>
        <RouterLink to="/expenses" class="text-primary hover:underline">Expenses</RouterLink>
      </div>
    </div>

    <ol v-if="recentActivity.length" class="relative mt-5 space-y-4 border-l-2 border-primary/20 pl-5">
      <li v-for="item in recentActivity" :key="item.id" class="relative">
        <span
          class="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface"
          :class="dotClass(item)"
          aria-hidden="true"
        />
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <RouterLink
              v-if="item.expenseId"
              :to="{ name: 'expense-entry', params: { id: item.expenseId } }"
              class="block truncate font-medium hover:underline"
            >
              {{ item.title }}
            </RouterLink>
            <p v-else class="truncate font-medium">{{ item.title }}</p>
            <p class="text-xs text-text-muted">{{ subtitle(item) }}</p>
          </div>
          <p
            class="shrink-0 max-w-[46%] text-end font-mono text-xs font-semibold leading-tight sm:text-sm"
            :class="item.kind === 'deposit' ? 'text-success' : 'text-warning'"
          >
            {{ item.kind === 'deposit' ? '+' : '−' }}{{ formatToman(item.amount) }}
          </p>
        </div>
      </li>
    </ol>

    <div v-else class="my-auto py-10 text-center">
      <p class="font-medium">No activity yet</p>
      <RouterLink to="/deposits" class="mt-3 inline-block text-sm font-medium text-primary hover:underline">
        Add your first deposit
      </RouterLink>
    </div>
  </section>
</template>
