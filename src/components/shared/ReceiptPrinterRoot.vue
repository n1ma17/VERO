<script setup lang="ts">
import { computed, toRef } from 'vue'
import { provideReceiptPrinter } from '@/composables/useReceiptPrinter'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { RECEIPT_PRINTER_ID } from '@/utils/scrollToReceiptPrinter'

const props = defineProps<{
  stage: ReceiptPrinterStage
  /** Auth ticket: keep the paper slot expanded; only the sheet moves (avoids tab-switch jumps). */
  pinSlotOpen?: boolean
}>()

provideReceiptPrinter(toRef(props, 'stage'))

const isOpen = computed(
  () =>
    props.pinSlotOpen ||
    props.stage === 'printing' ||
    props.stage === 'complete' ||
    props.stage === 'retracting',
)
</script>

<template>
  <section
    :id="RECEIPT_PRINTER_ID"
    aria-label="Receipt printer"
    class="receipt-printer isolate scroll-mt-24"
    :class="{ 'is-open': isOpen, 'receipt-printer--pin-slot': pinSlotOpen }"
    :data-stage="stage"
  >
    <slot />
  </section>
</template>
