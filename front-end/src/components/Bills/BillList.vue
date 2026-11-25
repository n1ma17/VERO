<script setup lang="ts">
import { computed } from 'vue'
import BillReceiptCard from '@/components/Bills/BillReceiptCard.vue'
import { useBills } from '@/composables/useBills'
import { formatCalendarMonth } from '@/utils/calendar'

const { billsInViewMonth, viewMonth, isPastViewMonth } = useBills()

const monthLabel = computed(() =>
  formatCalendarMonth(viewMonth.value.year, viewMonth.value.month),
)
</script>

<template>
  <section class="space-y-4">
    <h2 class="px-1 text-sm font-semibold text-text">
      {{ isPastViewMonth ? 'Bills in' : 'Active in' }} {{ monthLabel }}
    </h2>

    <ul
      v-if="billsInViewMonth.length"
      class="grid gap-x-6 gap-y-10 overflow-visible sm:grid-cols-2 lg:grid-cols-3"
    >
      <li v-for="bill in billsInViewMonth" :key="bill.id" class="overflow-visible pb-2">
        <BillReceiptCard :bill="bill" :read-only="isPastViewMonth" />
      </li>
    </ul>

    <p
      v-else
      class="rounded-sm border border-dashed border-text/30 p-8 text-center text-sm text-text-muted"
    >
      {{ isPastViewMonth ? 'No bills recorded for' : 'No bills active in' }}
      {{ monthLabel }}.
      <RouterLink
        v-if="!isPastViewMonth"
        :to="{ name: 'bill-entry' }"
        class="mt-2 block font-semibold text-accent hover:underline"
      >
        Define a bill
      </RouterLink>
    </p>
  </section>
</template>