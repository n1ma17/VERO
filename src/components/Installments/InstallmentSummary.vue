<script setup lang="ts">
import { computed } from 'vue'
import { useInstallments } from '@/composables/useInstallments'
import type { InstallmentStatus } from '@/types/installment'
import { getInstallmentStatus, installmentStatusLabels } from '@/utils/installmentStatus'

const { installments } = useInstallments()

const order: InstallmentStatus[] = ['paid', 'unpaid', 'overdue']

const valueClasses: Record<InstallmentStatus, string> = {
  paid: 'text-success',
  unpaid: 'text-warning',
  overdue: 'text-danger',
}

const counts = computed(() => {
  const result: Record<InstallmentStatus, number> = { paid: 0, unpaid: 0, overdue: 0 }
  for (const installment of installments.value) result[getInstallmentStatus(installment)]++
  return result
})
</script>

<template>
  <div class="flex min-w-0 items-stretch gap-3">
    <dl
      class="grid min-w-0 flex-1 grid-cols-3 divide-x divide-primary/15 overflow-hidden rounded-3xl bg-surface py-4 text-text"
    >
      <div v-for="status in order" :key="status" class="min-w-0 px-2 text-center sm:px-4">
        <dt class="text-xs font-medium uppercase tracking-widest text-text-muted">
          {{ installmentStatusLabels[status] }}
        </dt>
        <dd class="mt-1 font-mono text-2xl font-bold" :class="valueClasses[status]">
          {{ counts[status] }}
        </dd>
      </div>
    </dl>
  </div>
</template>
