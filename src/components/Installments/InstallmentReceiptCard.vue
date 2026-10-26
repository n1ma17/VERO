<script setup lang="ts">
import { computed } from 'vue'
import ApprovedStamp from '@/components/shared/ApprovedStamp.vue'
import BillLogoImage from '@/components/shared/BillLogoImage.vue'
import InstallmentStatusBadge from '@/components/shared/InstallmentStatusBadge.vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import type { Installment, InstallmentStatus } from '@/types/installment'
import { formatToman } from '@/utils/formatToman'
import { formatJalaliDate } from '@/utils/jalali'
import { getInstallmentStatus } from '@/utils/installmentStatus'

const props = defineProps<{
  installment: Installment
}>()

const statusStripClasses: Record<InstallmentStatus, string> = {
  paid: 'bg-success',
  unpaid: 'bg-warning',
  overdue: 'bg-danger',
}

const status = computed(() => getInstallmentStatus(props.installment))
const dueDate = computed(() =>
  formatJalaliDate(props.installment.dueYear, props.installment.dueMonth, props.installment.dueDay),
)
const amount = computed(() => formatToman(props.installment.amount))
</script>

<template>
  <RouterLink
    :to="{ name: 'installment-detail', params: { id: installment.id } }"
    class="relative block overflow-hidden rounded-t-3xl bg-surface pb-5 text-text  outline-none transition duration-200 hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-accent"
  >
    <div class="h-1.5" :class="statusStripClasses[status]" />

    <header class="flex items-start justify-between gap-3 px-4 pb-4 pt-5 sm:px-6">
      <div class="flex min-w-0 gap-3">
        <BillLogoImage :logo-key="installment.logoKey" size="md" />
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
            Bill due
          </p>
          <h3 class="mt-1 truncate text-lg font-semibold">{{ installment.title }}</h3>
        </div>
      </div>
      <InstallmentStatusBadge :status="status" />
    </header>

    <ReceiptDivider />

    <dl class="space-y-2 px-4 pt-4 font-mono text-sm sm:px-6">
      <div class="flex justify-between">
        <dt class="text-text-muted">Due date</dt>
        <dd>{{ dueDate }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-text-muted">Ref.</dt>
        <dd class="truncate text-right">{{ installment.billId.slice(0, 8) }}</dd>
      </div>
      <div class="flex items-baseline justify-between pt-2">
        <dt class="text-text-muted">Amount</dt>
        <dd class="text-xl font-bold">{{ amount }}</dd>
      </div>
    </dl>

    <ApprovedStamp
      v-if="status === 'paid'"
      :paid-at="installment.paidAt"
      class="absolute right-4 top-12 sm:right-6"
    />

    <ReceiptEdge />
  </RouterLink>
</template>
