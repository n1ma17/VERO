import { bumpMoneyData } from '@/composables/moneyGeneration'
import {
  alignBillsViewMonth,
  clearBills,
  loadBills,
  resetBillsViewMonth,
} from '@/composables/useBills'
import { clearCompanies, loadCompanies } from '@/composables/useCompanies'
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
    loadCompanies(),
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
    loadCompanies(),
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
  clearCompanies()
  clearDeposits()
  clearExpenses()
  clearInstallments()
  clearCurrency()
}
