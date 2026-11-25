<script setup lang="ts">
import { computed } from 'vue'
import InstallmentReceiptCard from '@/components/Installments/InstallmentReceiptCard.vue'
import { useInstallments } from '@/composables/useInstallments'
import { formatCalendarMonth } from '@/utils/calendar'

const { installments, viewMonth, isPastViewMonth } = useInstallments()

const monthLabel = computed(() =>
  formatCalendarMonth(viewMonth.value.year, viewMonth.value.month),
)
</script>

<template>
  <section class="space-y-4">
    <h2 class="px-1 text-sm font-semibold text-text">Bills due in {{ monthLabel }}</h2>

    <ul v-if="installments.length" class="grid gap-x-6 gap-y-10 overflow-visible sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="installment in installments" :key="installment.id" class="overflow-visible pb-2">
        <InstallmentReceiptCard :installment="installment" :read-only="isPastViewMonth" />
      </li>
    </ul>
    <p v-else class="rounded-3xl border border-dashed border-primary/20 p-8 text-center text-sm text-text-muted">
      No bills due in {{ monthLabel }}.
      <template v-if="!isPastViewMonth">
        <RouterLink :to="{ name: 'bill-entry' }" class="font-medium text-primary hover:underline">
          Define a bill
        </RouterLink>
        or choose another month.
      </template>
      <template v-else> Choose another month. </template>
    </p>
  </section>
</template>
