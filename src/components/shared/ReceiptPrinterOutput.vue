<script setup lang="ts">
import { useReceiptPrinter } from '@/composables/useReceiptPrinter'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const { stage } = useReceiptPrinter('ReceiptPrinterOutput')

const feedClasses: Record<ReceiptPrinterStage, string> = {
  idle: 'is-hidden',
  processing: 'is-hidden',
  retracting: 'is-retracting',
  printing: 'is-printing',
  complete: 'is-out',
}
</script>

<template>
  <div class="receipt-printer-mouth">
    <div class="receipt-printer-mouth-inner">
      <div
        class="receipt-printer-sheet"
        :class="feedClasses[stage]"
        :aria-hidden="stage !== 'complete'"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
