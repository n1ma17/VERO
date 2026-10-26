<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ReceiptBarcode from '@/components/shared/ReceiptBarcode.vue'
import ApprovedStamp from '@/components/shared/ApprovedStamp.vue'
import BillLogoImage from '@/components/shared/BillLogoImage.vue'
import InstallmentStatusBadge from '@/components/shared/InstallmentStatusBadge.vue'
import ReceiptDivider from '@/components/shared/ReceiptDivider.vue'
import ReceiptEdge from '@/components/shared/ReceiptEdge.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'
import type { InstallmentStatus } from '@/types/installment'
import { formatToman } from '@/utils/formatToman'
import { formatJalaliDate, formatTimestampAsJalali } from '@/utils/jalali'

const { installment, status } = useCurrentInstallment()

const statusStripClasses: Record<InstallmentStatus, string> = {
  paid: 'bg-success',
  unpaid: 'bg-warning',
  overdue: 'bg-danger',
}

const celebrating = ref(false)
let celebrateTimer: ReturnType<typeof setTimeout> | undefined

watch(
  status,
  (value, previous) => {
    if (value === 'paid' && previous && previous !== 'paid') {
      celebrating.value = true
      clearTimeout(celebrateTimer)
      celebrateTimer = setTimeout(() => {
        celebrating.value = false
      }, 900)
    }
  },
)

onBeforeUnmount(() => clearTimeout(celebrateTimer))

const staticRows = computed(() => {
  if (!installment.value) return []
  return [
    { label: 'Installment', value: installment.value.title },
    { label: 'Reference', value: installment.value.billId.slice(0, 8) },
    {
      label: 'Due date',
      value: formatJalaliDate(
        installment.value.dueYear,
        installment.value.dueMonth,
        installment.value.dueDay,
      ),
    },
  ]
})

const paidOnLabel = computed(() =>
  installment.value?.paidAt ? formatTimestampAsJalali(installment.value.paidAt) : '—',
)

const amount = computed(() => (installment.value ? formatToman(installment.value.amount) : ''))
const isPaid = computed(() => status.value === 'paid')
</script>

<template>
  <article
    v-if="installment && status"
    class="relative overflow-hidden rounded-t-3xl bg-surface pb-6 text-text transition-shadow duration-700 ease-out"
    :class="celebrating ? 'animate-receipt-celebrate motion-reduce:animate-none' : ''"
  >
    <div
      class="h-2 transition-colors duration-700 ease-out motion-reduce:transition-none"
      :class="statusStripClasses[status]"
    />

    <header class="px-5 pb-5 pt-6 text-center sm:px-8 sm:pb-6 sm:pt-7">
      <div class="mb-3 flex justify-center">
        <BillLogoImage :logo-key="installment.logoKey" size="md" />
      </div>
      <p class="text-xs font-medium uppercase tracking-widest text-text-muted">
        Payment receipt
      </p>
      <h2 class="mt-2 text-2xl font-bold">{{ installment.title }}</h2>
      <div class="mt-3 flex justify-center">
        <InstallmentStatusBadge :status="status" />
      </div>
    </header>

    <ReceiptDivider />

    <dl class="space-y-3 px-5 py-5 font-mono text-sm sm:px-8 sm:py-6">
      <div v-for="row in staticRows" :key="row.label" class="flex justify-between gap-4">
        <dt class="text-text-muted">{{ row.label }}</dt>
        <dd class="text-right">{{ row.value }}</dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt class="text-text-muted">Paid on</dt>
        <dd class="min-w-[6.5rem] text-right">
          <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out motion-reduce:transition-none motion-reduce:duration-0"
            enter-from-class="translate-y-1 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-250 ease-in motion-reduce:transition-none motion-reduce:duration-0"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-1 opacity-0"
          >
            <span
              :key="paidOnLabel"
              class="inline-block font-semibold transition-colors duration-500"
              :class="isPaid ? 'text-success' : 'text-text'"
            >
              {{ paidOnLabel }}
            </span>
          </Transition>
        </dd>
      </div>
    </dl>

    <ReceiptDivider />

    <div class="flex items-baseline justify-between gap-3 px-5 py-5 font-mono sm:px-8 sm:py-6">
      <span class="text-sm uppercase tracking-widest text-text-muted">Total</span>
      <span class="break-all text-right text-2xl font-bold transition-transform duration-500 ease-out motion-reduce:transition-none sm:text-3xl" :class="isPaid ? 'scale-105' : 'scale-100'">
        {{ amount }}
      </span>
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none"
      :class="isPaid ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="flex justify-center px-4 pb-8 pt-2">
          <Transition
            enter-active-class="transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-reduce:duration-0"
            enter-from-class="scale-[1.45] -rotate-[26deg] opacity-0"
            enter-to-class="scale-100 -rotate-12 opacity-80"
            leave-active-class="transition duration-300 ease-in motion-reduce:transition-none motion-reduce:duration-0"
            leave-from-class="scale-100 -rotate-12 opacity-80"
            leave-to-class="scale-90 -rotate-6 opacity-0"
          >
            <ApprovedStamp
              v-if="isPaid"
              :key="installment.paidAt ?? 'paid'"
              :paid-at="installment.paidAt"
              size="lg"
            />
          </Transition>
        </div>
      </div>
    </div>

    <ReceiptBarcode :code="installment.id" class="px-5 pb-4 sm:px-8" />

    <ReceiptEdge :teeth="24" />
  </article>

  <div v-else class="rounded-3xl bg-surface p-8 text-center text-text">
    <p class="font-semibold">Installment not found</p>
    <p class="mt-1 text-sm text-text-muted">It may have been removed.</p>
  </div>
</template>
