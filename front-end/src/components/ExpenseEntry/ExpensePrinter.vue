<script setup lang="ts">
import ReceiptPaperFooter from '@/components/shared/ReceiptPaperFooter.vue'
import ReceiptPaperHeader from '@/components/shared/ReceiptPaperHeader.vue'
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
        <ReceiptPaperHeader
          :kind="snapshot.isUpdate ? 'Expense update' : 'Purchase receipt'"
          :meta="snapshot.dateLabel"
        />

        <div class="mt-5 border-t border-dashed border-text-muted/60" />

        <dl class="mt-4 space-y-1.5">
          <div class="flex justify-between gap-4">
            <dt>Item</dt>
            <dd class="truncate text-right">{{ snapshot.title }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt>Category</dt>
            <dd class="text-right">{{ expenseCategories[snapshot.category].label }}</dd>
          </div>
          <div v-if="snapshot.note" class="flex justify-between gap-4">
            <dt>Note</dt>
            <dd class="truncate text-right">{{ snapshot.note }}</dd>
          </div>
        </dl>

        <div class="mt-4 border-t border-dashed border-text-muted/60" />

        <div class="mt-4 flex items-baseline justify-between gap-4">
          <span class="text-lg font-bold uppercase tracking-[0.12em]">Total</span>
          <span class="text-xl font-bold">{{ snapshot.amountLabel }}</span>
        </div>

        <ReceiptPaperFooter
          status="Recorded"
          :code="snapshot.id.slice(0, 8).toUpperCase()"
          note="Deducted from this month"
        />
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
