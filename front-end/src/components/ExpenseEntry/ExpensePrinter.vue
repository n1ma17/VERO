<script setup lang="ts">
import ReceiptPrinterMachine from '@/components/shared/ReceiptPrinterMachine.vue'
import ReceiptPrinterOutput from '@/components/shared/ReceiptPrinterOutput.vue'
import ReceiptPrinterPaper from '@/components/shared/ReceiptPrinterPaper.vue'
import ReceiptPrinterRoot from '@/components/shared/ReceiptPrinterRoot.vue'
import ReceiptPrinterScreen from '@/components/shared/ReceiptPrinterScreen.vue'
import ReceiptPrinterStatus from '@/components/shared/ReceiptPrinterStatus.vue'
import { useExpenseEntryFlow } from '@/composables/useExpenseEntryFlow'
import type { ReceiptPrinterStage } from '@/types/receiptPrinter'
import { expenseCategories } from '@/utils/expenseCategories'

const { stage, snapshot } = useExpenseEntryFlow()

const statusLabels: Record<ReceiptPrinterStage, string> = {
  idle: 'Ready to record',
  processing: 'Saving purchase',
  retracting: 'Retracting receipt',
  printing: 'Printing your receipt',
  complete: 'Purchase recorded',
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
            {{ snapshot.isUpdate ? 'Expense update receipt' : 'Purchase receipt' }}
          </p>
        </header>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <dl class="space-y-2">
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Item</dt>
            <dd class="truncate text-right">{{ snapshot.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Category</dt>
            <dd class="text-right">{{ expenseCategories[snapshot.category].label }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Date</dt>
            <dd>{{ snapshot.dateLabel }}</dd>
          </div>
          <div v-if="snapshot.note" class="flex justify-between gap-4">
            <dt class="text-text-muted">Note</dt>
            <dd class="truncate text-right">{{ snapshot.note }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-text-muted">Ref.</dt>
            <dd class="font-mono text-xs">{{ snapshot.id.slice(0, 8) }}</dd>
          </div>
        </dl>

        <div class="my-5 border-t-2 border-dashed border-text-muted/40" />

        <div class="flex items-baseline justify-between">
          <span class="uppercase tracking-widest">Total</span>
          <span class="text-xl font-bold">{{ snapshot.amountLabel }}</span>
        </div>

        <p class="mt-6 text-center text-xs text-text-muted">
          Deducted from your balance for this month.
        </p>
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
