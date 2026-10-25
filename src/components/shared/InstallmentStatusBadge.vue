<script setup lang="ts">
import type { InstallmentStatus } from '@/types/installment'
import { installmentStatusLabels } from '@/utils/installmentStatus'

defineProps<{
  status: InstallmentStatus
}>()

const statusClasses: Record<InstallmentStatus, { badge: string; dot: string }> = {
  paid: { badge: 'bg-success/15 text-success', dot: 'bg-success' },
  unpaid: { badge: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  overdue: { badge: 'bg-danger/15 text-danger', dot: 'bg-danger' },
}
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
    enter-from-class="scale-90 opacity-0"
    enter-to-class="scale-100 opacity-100"
    leave-active-class="transition duration-200 ease-in motion-reduce:transition-none motion-reduce:duration-0"
    leave-from-class="scale-100 opacity-100"
    leave-to-class="scale-90 opacity-0"
  >
    <span
      :key="status"
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
      :class="statusClasses[status].badge"
    >
      <span class="size-1.5 rounded-full transition-colors duration-500" :class="statusClasses[status].dot" />
      {{ installmentStatusLabels[status] }}
    </span>
  </Transition>
</template>
