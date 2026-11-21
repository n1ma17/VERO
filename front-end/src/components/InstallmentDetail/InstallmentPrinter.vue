<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ReceiptPaperFooter from '@/components/shared/ReceiptPaperFooter.vue'
import ReceiptPaperHeader from '@/components/shared/ReceiptPaperHeader.vue'
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import { useCurrentInstallment } from '@/composables/useCurrentInstallment'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { formatMoney } from '@/utils/formatMoney'
import { formatCalendarDate, formatTimestampAsCalendar } from '@/utils/calendar'
import { scrollToReceiptPrinter } from '@/utils/scrollToReceiptPrinter'

const PROCESSING_MS = 1200
/** Matches the 2s sheet transform transition in `main.css`. */
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

const amount = computed(() => (installment.value ? formatMoney(installment.value.amount) : ''))
const dueDate = computed(() =>
  installment.value
    ? formatCalendarDate(
        installment.value.dueYear,
        installment.value.dueMonth,
        installment.value.dueDay,
      )
    : '',
)
const paidOn = computed(() =>
  formatTimestampAsCalendar(installment.value?.paidAt ?? new Date().toISOString()),
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
        <ReceiptPaperHeader kind="Installment payment" :meta="`Paid ${paidOn}`" />

        <div class="mt-5 border-t border-dashed border-text-muted/60" />

        <dl class="mt-4 space-y-1.5">
          <div class="flex justify-between gap-4">
            <dt>Item</dt>
            <dd class="truncate text-right">{{ installment.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt>Due</dt>
            <dd>{{ dueDate }}</dd>
          </div>
        </dl>

        <div class="mt-4 border-t border-dashed border-text-muted/60" />

        <div class="mt-4 flex items-baseline justify-between gap-4">
          <span class="text-lg font-bold uppercase tracking-[0.12em]">Total</span>
          <span class="text-xl font-bold">{{ amount }}</span>
        </div>

        <ReceiptPaperFooter
          status="Approved"
          :code="installment.billId.slice(0, 8).toUpperCase()"
          note="Thank you · Paid in full"
        />
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>

    <div class="relative z-10 mt-6 flex w-full justify-center px-2">
      <BaseButton class="w-full max-w-sm" :disabled="stage !== 'idle'" @click="pay">{{ payLabel }}</BaseButton>
    </div>
  </ReceiptPrinterRoot>
</template>
