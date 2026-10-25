<script setup lang="ts">
import BillLogoImage from '@/components/shared/BillLogoImage.vue'
import { useDashboard, type UpcomingBill } from '@/composables/useDashboard'
import { formatToman } from '@/utils/formatToman'

const { upcomingBills } = useDashboard()

const dueClasses = {
  overdue: 'bg-danger/15 text-danger',
  soon: 'bg-warning/15 text-warning',
  later: 'bg-primary/15/15 text-text-muted',
} as const

function dueTone(bill: UpcomingBill): keyof typeof dueClasses {
  if (bill.daysLeft < 0) return 'overdue'
  if (bill.daysLeft <= 3) return 'soon'
  return 'later'
}

function dueText(bill: UpcomingBill): string {
  if (bill.daysLeft < 0) return `${-bill.daysLeft}d overdue`
  if (bill.daysLeft === 0) return 'Due today'
  if (bill.daysLeft === 1) return 'Tomorrow'
  return `In ${bill.daysLeft}d`
}
</script>

<template>
  <section
    class="flex animate-fade-up flex-col rounded-3xl bg-surface p-6 text-text shadow-lg [animation-delay:360ms] motion-reduce:animate-none"
  >
    <div class="flex items-baseline justify-between">
      <h2 class="text-lg font-semibold">Upcoming bills</h2>
      <RouterLink to="/installments" class="text-xs font-medium text-primary hover:underline">
        View all
      </RouterLink>
    </div>

    <ul v-if="upcomingBills.length" class="mt-4 space-y-2">
      <li v-for="bill in upcomingBills" :key="bill.id">
        <RouterLink
          :to="{ name: 'installment-detail', params: { id: bill.id } }"
          class="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-primary/10"
        >
          <BillLogoImage v-if="bill.logoKey" :logo-key="bill.logoKey" />
          <span
            v-else
            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase text-background"
          >
            {{ bill.title.slice(0, 1) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium group-hover:underline">{{ bill.title }}</p>
            <p class="truncate text-xs text-text-muted">{{ bill.dueLabel }}</p>
          </div>
          <div class="text-right">
            <p class="whitespace-nowrap font-mono text-sm font-semibold">{{ formatToman(bill.amount) }}</p>
            <span
              class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="dueClasses[dueTone(bill)]"
            >
              {{ dueText(bill) }}
            </span>
          </div>
        </RouterLink>
      </li>
    </ul>

    <div v-else class="my-auto py-10 text-center">
      <p class="font-medium">Nothing to pay</p>
      <p class="mt-1 text-sm text-text-muted">All installments are settled.</p>
      <RouterLink to="/bills" class="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Define a bill
      </RouterLink>
    </div>
  </section>
</template>
