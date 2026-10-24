<script setup lang="ts">
import { computed } from 'vue'
import InstallmentReceiptCard from '@/components/Installments/InstallmentReceiptCard.vue'
import { useInstallments } from '@/composables/useInstallments'
import { formatJalaliMonth } from '@/utils/jalali'

const { installments, viewMonth } = useInstallments()

const monthLabel = computed(() =>
  formatJalaliMonth(viewMonth.value.year, viewMonth.value.month),
)
</script>

<template>
  <section class="space-y-4">
    <h2 class="px-1 text-sm font-semibold text-content">Bills due in {{ monthLabel }}</h2>

    <ul v-if="installments.length" class="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="installment in installments" :key="installment.id">
        <InstallmentReceiptCard :installment="installment" />
      </li>
    </ul>
    <p v-else class="rounded-3xl border border-dashed border-border-subtle/50 p-8 text-center text-sm text-content-muted">
      No bills due in {{ monthLabel }}.
      <RouterLink to="/bills" class="font-medium text-content hover:underline">Add bills</RouterLink>
      or choose another month.
    </p>
  </section>
</template>
