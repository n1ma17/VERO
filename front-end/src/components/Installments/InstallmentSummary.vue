<script setup lang="ts">
import { computed } from 'vue'
import { useInstallments } from '@/composables/useInstallments'
import type { InstallmentStatus } from '@/types/installment'
import { formatTomanNumber } from '@/utils/formatToman'
import { getInstallmentStatus, installmentStatusLabels } from '@/utils/installmentStatus'

const { installments } = useInstallments()

const order: InstallmentStatus[] = ['paid', 'unpaid', 'overdue']

const valueClasses: Record<InstallmentStatus, string> = {
  paid: 'text-success',
  unpaid: 'text-warning',
  overdue: 'text-danger',
}

const stats = computed(() => {
  const counts: Record<InstallmentStatus, number> = { paid: 0, unpaid: 0, overdue: 0 }
  const amounts: Record<InstallmentStatus, number> = { paid: 0, unpaid: 0, overdue: 0 }
  for (const installment of installments.value) {
    const status = getInstallmentStatus(installment)
    counts[status]++
    amounts[status] += installment.amount
  }
  return { counts, amounts }
})
</script>

<template>
  <div class="flex min-w-0 items-stretch gap-3">
    <dl
      class="grid min-w-0 flex-1 grid-cols-3 divide-x divide-primary/15 overflow-hidden rounded-3xl bg-surface py-4 text-text"
    >
      <div v-for="status in order" :key="status" class="min-w-0 px-2 text-center sm:px-4">
        <dt class="text-[10px] font-medium uppercase tracking-wide text-text-muted sm:text-xs sm:tracking-widest">
          {{ installmentStatusLabels[status] }}
        </dt>
        <dd class="mt-1 font-mono text-2xl font-bold" :class="valueClasses[status]">
          {{ stats.counts[status] }}
        </dd>
        <p
          class="mt-0.5 font-mono text-[10px] font-semibold leading-tight sm:text-xs"
          :class="valueClasses[status]"
        >
          {{ formatTomanNumber(stats.amounts[status]) }}
          <span class="font-sans text-[9px] font-medium opacity-80 sm:text-[10px]">Toman</span>
        </p>
      </div>
    </dl>
  </div>
</template>
