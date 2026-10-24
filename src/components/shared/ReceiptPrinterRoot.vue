<script setup lang="ts">
import { toRef } from 'vue'
import { provideReceiptPrinter } from '@/composables/useReceiptPrinter'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { RECEIPT_PRINTER_ID } from '@/utils/scrollToReceiptPrinter'

const props = defineProps<{
  stage: ReceiptPrinterStage
}>()

provideReceiptPrinter(toRef(props, 'stage'))
</script>

<template>
  <section
    :id="RECEIPT_PRINTER_ID"
    aria-label="Receipt printer"
    class="relative isolate flex w-full max-w-sm flex-col items-center scroll-mt-24"
    :data-stage="stage"
  >
    <slot />
  </section>
</template>
