import { createPrinterFlow } from '@/composables/usePrinterFlow'
import type { ExpenseCategory } from '@/types/expense'

export interface ExpenseReceiptSnapshot {
  id: string
  title: string
  category: ExpenseCategory
  dateLabel: string
  amountLabel: string
  note: string | null
  isUpdate: boolean
}

export const useExpenseEntryFlow = createPrinterFlow<ExpenseReceiptSnapshot>()
