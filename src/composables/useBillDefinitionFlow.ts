import { createPrinterFlow } from '@/composables/usePrinterFlow'

export interface BillReceiptSnapshot {
  id: string
  title: string
  firstDueLabel: string
  periodLabel: string
  amountLabel: string
  isUpdate: boolean
}

export const useBillDefinitionFlow = createPrinterFlow<BillReceiptSnapshot>()
