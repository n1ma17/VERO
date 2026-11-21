import { bumpMoneyData } from '@/composables/moneyGeneration'
import { clearBillLogos } from '@/composables/useBillLogos'
import { clearBills, loadBills } from '@/composables/useBills'
import { clearDeposits, loadDeposits } from '@/composables/useBankDeposits'
import { clearCurrency, loadCurrency } from '@/composables/useCurrency'
import { clearExpenses, loadExpenses } from '@/composables/useExpenses'
import { clearInstallments, loadInstallments } from '@/composables/useInstallments'
import { armLedger, clearLedger, loadLedger } from '@/composables/useLedger'

export async function loadMoneyCollections(): Promise<void> {
  armLedger()
  await Promise.all([
    loadCurrency(),
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
