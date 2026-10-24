<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { formatDate } from '@/utils/date'
import { formatToman } from '@/utils/formatToman'
import { formatJalaliDate } from '@/utils/jalali'
import { scrollToReceiptPrinter } from '@/utils/scrollToReceiptPrinter'

const PROCESSING_MS = 1200
/** Matches the 1.75s `animate-receipt-feed` duration in `main.css`. */
const PRINTING_MS = 1800

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to pay',
  processing: 'Processing payment',
  printing: 'Printing your receipt',
  complete: 'Payment complete',
}

const { installment, setPaid } = useCurrentInstallment()

const stage = ref<ReceiptPrinterStage>('idle')
let timer: ReturnType<typeof setTimeout> | undefined
let paying = false

watch(
  () => [installment.value?.id, installment.value?.paidAt],
  () => {
    clearTimeout(timer)
    stage.value = installment.value?.paidAt ? 'complete' : 'idle'
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))

function beginPay(id: string) {
  stage.value = 'processing'
  timer = setTimeout(() => {
    stage.value = 'printing'
    timer = setTimeout(() => {
      stage.value = 'complete'
      setPaid(id, true)
    }, PRINTING_MS)
  }, PROCESSING_MS)
}

function pay() {
  if (!installment.value || stage.value !== 'idle' || paying) return
  const id = installment.value.id
  paying = true
  void scrollToReceiptPrinter()
    .then(() => {
      paying = false
      if (stage.value !== 'idle') return
      beginPay(id)
    })
    .catch(() => {
      paying = false
      if (stage.value !== 'idle') return
      beginPay(id)
    })
}

const amount = computed(() => (installment.value ? formatToman(installment.value.amount) : ''))
const dueDate = computed(() =>
  installment.value
    ? formatJalaliDate(
        installment.value.dueYear,
        installment.value.dueMonth,
        installment.value.dueDay,
      )
    : '',
)
const paidOn = computed(() => formatDate(installment.value?.paidAt ?? new Date().toISOString()))

const payLabel = computed(() => {
  if (stage.value === 'idle') return `Pay ${amount.value}`
  if (stage.value === 'complete') return 'Paid'
  return 'Paying…'
})
</script>

<template>
  <ReceiptPrinterRoot v-if="installment" :stage="stage" class="mx-auto">
    <ReceiptPrinterMachine>
      <div class="relative z-10 flex h-11 items-start justify-between">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="size-6 text-accent">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5 2h14v20l-2.5-1.5L14 22l-2-1.5L10 22l-2.5-1.5L5 22V2Zm3 5v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z"
          />
        </svg>
        <BaseButton :disabled="stage !== 'idle'" @click="pay">{{ payLabel }}</BaseButton>
      </div>

      <ReceiptPrinterScreen>
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ installment.title }}</p>
              <p class="mt-0.5 text-xs text-content-muted">Due {{ dueDate }}</p>
            </div>
            <strong class="font-mono text-lg">{{ amount }}</strong>
          </div>
          <ReceiptPrinterStatus :labels="statusLabels" />
        </div>
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper>
        <header class="text-center">
          <p class="text-base font-bold uppercase tracking-widest">Money Management</p>
          <p class="mt-1 text-xs text-content-on-surface-muted">Installment payment receipt</p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-content-on-surface-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Item</dt>
            <dd class="truncate text-right">{{ installment.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Ref.</dt>
            <dd>{{ installment.billId.slice(0, 8) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Due</dt>
            <dd>{{ dueDate }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-content-on-surface-muted">Paid</dt>
            <dd>{{ paidOn }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-content-on-surface-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Total paid</span>
          <span class="text-xl font-bold">{{ amount }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-content-on-surface-muted">
          Thank you for your payment.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
