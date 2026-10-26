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
import { formatToman } from '@/utils/formatToman'
import { formatJalaliDate, formatTimestampAsJalali } from '@/utils/jalali'
import { scrollToReceiptPrinter } from '@/utils/scrollToReceiptPrinter'

const PROCESSING_MS = 1200
/** Matches the 2s `animate-receipt-feed` duration in `main.css`. */
const PRINTING_MS = 2000

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to pay',
  processing: 'Processing payment',
  retracting: 'Retracting receipt',
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
const paidOn = computed(() =>
  formatTimestampAsJalali(installment.value?.paidAt ?? new Date().toISOString()),
)

const payLabel = computed(() => {
  if (stage.value === 'idle') return `Pay ${amount.value}`
  if (stage.value === 'complete') return 'Paid'
  return 'Paying…'
})
</script>

<template>
  <ReceiptPrinterRoot v-if="installment" :stage="stage" class="mx-auto">
    <ReceiptPrinterMachine>
      <ReceiptPrinterScreen>
        <ReceiptPrinterStatus :labels="statusLabels" />
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper>
        <header class="text-center">
          <p class="text-base font-bold uppercase tracking-widest">Money Management</p>
          <p class="mt-1 text-xs text-text-muted">Installment payment receipt</p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Item</dt>
            <dd class="truncate text-right">{{ installment.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Ref.</dt>
            <dd>{{ installment.billId.slice(0, 8) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Due</dt>
            <dd>{{ dueDate }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Paid</dt>
            <dd>{{ paidOn }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Total paid</span>
          <span class="text-xl font-bold">{{ amount }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-text-muted">
          Thank you for your payment.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>

    <div class="relative z-10 mt-6 flex w-full justify-center px-2">
      <BaseButton class="w-full max-w-sm" :disabled="stage !== 'idle'" @click="pay">{{ payLabel }}</BaseButton>
    </div>
  </ReceiptPrinterRoot>
</template>
