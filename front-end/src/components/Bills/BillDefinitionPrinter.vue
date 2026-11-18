<script setup lang="ts">
import BillIssuedReceiptBody from '@/components/Bills/BillIssuedReceiptBody.vue'
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
        <BillIssuedReceiptBody
          :kind="snapshot.isUpdate ? 'Bill update' : 'Bill definition'"
          :meta="`First due ${snapshot.firstDueLabel}`"
          :title="snapshot.title"
          :period-label="snapshot.periodLabel"
          :amount-label="snapshot.amountLabel"
          :ref-code="snapshot.id.slice(0, 8).toUpperCase()"
        />
      </ReceiptPrinterPaper>
    </ReceiptPrinterOutput>
  </ReceiptPrinterRoot>
</template>
