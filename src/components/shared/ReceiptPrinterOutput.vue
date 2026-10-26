<script setup lang="ts">
import { computed } from 'vue'
import { useReceiptPrinter } from '@/composables/useReceiptPrinter'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const { stage } = useReceiptPrinter('ReceiptPrinterOutput')

const feedClasses: Record<ReceiptPrinterStage, string> = {
  idle: '-translate-y-full opacity-0',
  processing: '-translate-y-full opacity-0',
  retracting: 'animate-receipt-retract opacity-100 motion-reduce:animate-none',
  printing: 'animate-receipt-feed opacity-100 motion-reduce:animate-none',
  complete: 'translate-y-0 opacity-100',
}

const isPaperVisible = computed(
  () =>
    stage.value === 'retracting' || stage.value === 'printing' || stage.value === 'complete',
)
</script>

<template>
  <div class="relative z-50 -mt-4 w-[85%] overflow-hidden px-2 pb-3">
    <div
      v-if="isPaperVisible"
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-2 -top-1 z-20 h-2 bg-primary-slot/75 blur-md"
    />
    <div
      class="relative will-change-transform"
      :class="feedClasses[stage]"
      :aria-hidden="stage !== 'complete'"
    >
      <slot />
    </div>
  </div>
</template>
