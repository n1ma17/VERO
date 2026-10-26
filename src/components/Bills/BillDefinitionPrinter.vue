<script setup lang="ts">
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import { useBillDefinitionFlow } from '@/composables/useBillDefinitionFlow'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'

const { stage, snapshot } = useBillDefinitionFlow()

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to issue',
  processing: 'Saving bill',
  retracting: 'Retracting receipt',
  printing: 'Printing your receipt',
  complete: 'Bill issued',
}
</script>

<template>
  <ReceiptPrinterRoot :stage="stage" class="mx-auto lg:mx-0 lg:ml-auto">
    <ReceiptPrinterMachine>
      <ReceiptPrinterScreen>
        <ReceiptPrinterStatus :labels="statusLabels" />
      </ReceiptPrinterScreen>
    </ReceiptPrinterMachine>

    <ReceiptPrinterOutput>
      <ReceiptPrinterPaper v-if="snapshot">
        <header class="text-center">
          <p class="text-base font-bold uppercase tracking-widest">Money Management</p>
          <p class="mt-1 text-xs text-text-muted">
            {{ snapshot.isUpdate ? 'Bill update receipt' : 'Bill definition receipt' }}
          </p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Title</dt>
            <dd class="truncate text-right">{{ snapshot.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Ref.</dt>
            <dd class="font-mono text-xs">{{ snapshot.id.slice(0, 8) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Period</dt>
            <dd class="text-right text-xs">{{ snapshot.periodLabel }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">First due</dt>
            <dd>{{ snapshot.firstDueLabel }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Amount</span>
          <span class="text-xl font-bold">{{ snapshot.amountLabel }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-text-muted">
          Installments will appear on the Installments page.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
