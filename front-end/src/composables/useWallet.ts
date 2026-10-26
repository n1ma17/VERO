import { api } from '@/api/http'
import { replaceBills } from '@/composables/useBills'
import { replaceDeposits } from '@/composables/useBankDeposits'
import { replaceExpenses } from '@/composables/useExpenses'
import { replaceInstallments } from '@/composables/useInstallments'
import type { BankDeposit } from '@/types/bankDeposit'
import type { Bill } from '@/types/bill'
import type { Expense } from '@/types/expense'
import type { Installment } from '@/types/installment'

export interface WalletSnapshot {
  bills: Bill[]
  deposits: BankDeposit[]
  expenses: Expense[]
  installments: Installment[]
}

export async function hydrateWallet(): Promise<void> {
  const snapshot = await api<WalletSnapshot>('/api/wallet')
  replaceBills(snapshot.bills)
  replaceDeposits(snapshot.deposits)
  replaceExpenses(snapshot.expenses)
  replaceInstallments(snapshot.installments)
}

export function clearWallet(): void {
  replaceBills([])
  replaceDeposits([])
  replaceExpenses([])
  replaceInstallments([])
}
