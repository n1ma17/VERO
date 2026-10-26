import type { ExpenseCategory } from '@/types/expense'
import type { InstallmentStatus } from '@/types/installment'

export type LedgerEntryKind = 'deposit' | 'bill' | 'expense'

export interface LedgerEntry {
  id: string
  kind: LedgerEntryKind
  title: string
  detail: string | null
  /** Always positive; `kind` decides whether it adds or subtracts. */
  amount: number
  year: number
  month: number
  day: number
  /** Running balance after this entry. */
  balance: number
  status: InstallmentStatus | null
  installmentId: string | null
  expenseId: string | null
  category: ExpenseCategory | null
}

export interface LedgerMonthPoint {
  year: number
  month: number
  label: string
  income: number
  bills: number
  expenses: number
  /** Cumulative balance at the end of the month. */
  balance: number
}

/** One Jalali month statement from `GET /api/ledger?date=` (Gregorian ISO). */
export interface LedgerMonth {
  year: number
  month: number
  monthIncome: number
  monthBills: number
  monthExpenses: number
  monthSpending: number
  monthNet: number
  openingBalance: number
  closingBalance: number
  entries: LedgerEntry[]
  depositCount: number
  billCount: number
  expenseCount: number
  paidBillsTotal: number
  unpaidBillsTotal: number
  chartSeries: LedgerMonthPoint[]
}
