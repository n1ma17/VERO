<script setup lang="ts">
import { computed } from 'vue'
import ApprovedStamp from '@/components/shared/ApprovedStamp.vue'
import InstallmentStatusBadge from '@/components/shared/InstallmentStatusBadge.vue'
import ReceiptBillIdentity from '@/components/shared/ReceiptBillIdentity.vue'
import ReceiptPaperHeader from '@/components/shared/ReceiptPaperHeader.vue'
import type { Installment } from '@/types/installment'
import { formatMoney } from '@/utils/formatMoney'
import { formatCalendarDate } from '@/utils/calendar'
import { getInstallmentStatus } from '@/utils/installmentStatus'

const props = withDefaults(
  defineProps<{
    installment: Installment
    readOnly?: boolean
  }>(),
  { readOnly: false },
)

const status = computed(() => getInstallmentStatus(props.installment))
const dueDate = computed(() =>
  formatCalendarDate(props.installment.dueYear, props.installment.dueMonth, props.installment.dueDay),
)
const amount = computed(() => formatMoney(props.installment.amount))
const refCode = computed(() => props.installment.billId.slice(0, 8).toUpperCase())

const cardClass = computed(() =>
  props.readOnly
    ? 'receipt-paper receipt-paper--card relative block opacity-90 outline-none transition-opacity duration-200 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
    : 'receipt-paper receipt-paper--card relative block outline-none transition-opacity duration-200 hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
)
</script>

<template>
  <RouterLink
    :to="{ name: 'installment-detail', params: { id: installment.id } }"
    :class="cardClass"
    :aria-label="readOnly ? 'Past installment (view only)' : undefined"
  >
    <InstallmentStatusBadge class="absolute right-3 top-3 z-10" :status="status" />

    <ReceiptPaperHeader kind="Bill due" :meta="dueDate" />
    <div class="mt-4 border-t border-dashed border-text-muted/60" />

    <ReceiptBillIdentity
      :title="installment.title"
      :company-name="installment.companyName"
      :logo-key="installment.logoKey"
    />

    <dl class="mt-4 space-y-1.5 text-sm">
      <div class="flex justify-between gap-4">
        <dt>Ref.</dt>
        <dd class="font-mono text-xs uppercase">{{ refCode }}</dd>
      </div>
    </dl>

    <div class="mt-4 border-t border-dashed border-text-muted/60" />

    <div class="mt-4 flex flex-col items-baseline justify-between gap-4">
      <span class="text-md font-[500] uppercase tracking-[0.12em]">Amount</span>
      <span class="text-lg font-bold tabular-nums">{{ amount }}</span>
    </div>

    <ApprovedStamp
      v-if="status === 'paid'"
      :paid-at="installment.paidAt"
      class="absolute right-3 top-32 sm:right-4"
    />

    <p
      v-if="readOnly"
      class="border-t border-dashed border-text/20 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted"
    >
      View only — past month
    </p>
  </RouterLink>
</template>