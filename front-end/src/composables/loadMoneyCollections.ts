import { clearBills, loadBills } from '@/composables/useBills'
import { clearDeposits, loadDeposits } from '@/composables/useBankDeposits'
import { clearExpenses, loadExpenses } from '@/composables/useExpenses'
import { clearInstallments, loadInstallments } from '@/composables/useInstallments'
import { armLedger, clearLedger, loadLedger } from '@/composables/useLedger'

export async function loadMoneyCollections(): Promise<void> {
  armLedger()
  await Promise.all([
    loadBills(),
    loadDeposits(),
    loadExpenses(),
    loadInstallments(),
    loadLedger(),
  ])
}

export function clearMoneyCollections(): void {
  clearLedger()
  clearBills()
  clearDeposits()
  clearExpenses()
  clearInstallments()
}
