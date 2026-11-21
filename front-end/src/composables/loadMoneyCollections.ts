import { bumpMoneyData } from '@/composables/moneyGeneration'
import { clearBillLogos } from '@/composables/useBillLogos'
import {
  alignBillsViewMonth,
  clearBills,
  loadBills,
  resetBillsViewMonth,
} from '@/composables/useBills'
import {
  alignDepositsViewMonth,
  clearDeposits,
  loadDeposits,
  resetDepositsViewMonth,
} from '@/composables/useBankDeposits'
import { clearCurrency, loadCurrency } from '@/composables/useCurrency'
import {
  alignExpensesViewMonth,
  clearExpenses,
  loadExpenses,
  resetExpensesViewMonth,
} from '@/composables/useExpenses'
import {
  alignInstallmentsViewMonth,
  clearInstallments,
  loadInstallments,
  resetInstallmentsViewMonth,
} from '@/composables/useInstallments'
import {
  alignLedgerViewMonth,
  armLedger,
  clearLedger,
  loadLedger,
  resetLedgerViewMonth,
} from '@/composables/useLedger'
import { resetViewMonthsToCurrentCalendar } from '@/composables/viewMonthSync'

export async function loadMoneyCollections(): Promise<void> {
  armLedger()
  await loadCurrency()
  alignBillsViewMonth()
  alignDepositsViewMonth()
  alignExpensesViewMonth()
  alignInstallmentsViewMonth()
  alignLedgerViewMonth()
  await Promise.all([
    loadBills(),
    loadDeposits(),
    loadExpenses(),
    loadInstallments(),
    loadLedger(),
  ])
  bumpMoneyData()
}

/** Remap UI calendar dates after IRR ↔ other currency (Jalali ↔ Gregorian). */
export async function reloadMoneyCollectionsForCalendar(): Promise<void> {
  resetViewMonthsToCurrentCalendar()
  resetBillsViewMonth()
  resetDepositsViewMonth()
  resetExpensesViewMonth()
  resetInstallmentsViewMonth()
  resetLedgerViewMonth()
  await Promise.all([
    loadBills(),
    loadDeposits(),
    loadExpenses(),
    loadInstallments(),
    loadLedger(),
  ])
  bumpMoneyData()
}

export function clearMoneyCollections(): void {
  clearLedger()
  clearBills()
  clearDeposits()
  clearExpenses()
  clearInstallments()
  clearBillLogos()
  clearCurrency()
}
