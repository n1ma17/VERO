<script setup lang="ts">
import { computed } from 'vue'
import { useReceiptPrinter } from '@/composables/useReceiptPrinter'

const { stage } = useReceiptPrinter('ReceiptPrinterMachine')

const signalState = computed(() => {
  if (stage.value === 'complete') return 'complete'
  if (stage.value === 'idle') return 'idle'
  return 'working'
})
</script>

<template>
  <div class="receipt-printer-machine">
    <p class="receipt-printer-name">ICprint</p>
    <span class="receipt-printer-signal" :data-state="signalState" aria-hidden="true" />
    <div class="receipt-printer-lcd">
      <slot />
    </div>
  </div>
</template>
