import type { BankDeposit } from '@/types/bankDeposit'
import type { Expense } from '@/types/expense'
import type { Installment } from '@/types/installment'
import { monthToIndex } from '@/utils/jalali'

export interface MonthTotals {
  income: number
  bills: number
  expenses: number
}

/**
 * Income by deposit "counted" month, bills by installment due month, expenses by purchase month.
 * Keyed by `monthToIndex`. Used by the dashboard overview; the Transactions page reads
 * the same totals from `GET /api/ledger`.
 */
export function buildMonthTotals(
  deposits: ReadonlyArray<Pick<BankDeposit, 'amount' | 'bookedYear' | 'bookedMonth'>>,
  installments: ReadonlyArray<Pick<Installment, 'amount' | 'dueYear' | 'dueMonth'>>,
  expenses: ReadonlyArray<Pick<Expense, 'amount' | 'jalaliYear' | 'jalaliMonth'>>,
): Map<number, MonthTotals> {
  const totals = new Map<number, MonthTotals>()
  const bucket = (index: number) => {
    let entry = totals.get(index)
    if (!entry) {
      entry = { income: 0, bills: 0, expenses: 0 }
      totals.set(index, entry)
    }
    return entry
  }
  for (const deposit of deposits) {
    bucket(monthToIndex(deposit.bookedYear, deposit.bookedMonth)).income += deposit.amount
  }
  for (const installment of installments) {
    bucket(monthToIndex(installment.dueYear, installment.dueMonth)).bills += installment.amount
  }
  for (const expense of expenses) {
    bucket(monthToIndex(expense.jalaliYear, expense.jalaliMonth)).expenses += expense.amount
  }
  return totals
}

export function monthNet(totals: MonthTotals | undefined): number {
  return totals ? totals.income - totals.bills - totals.expenses : 0
}

/** Cumulative balance at the end of month `index`; may be negative. */
export function balanceThrough(totals: Map<number, MonthTotals>, index: number): number {
  let sum = 0
  for (const [monthIndex, month] of totals) {
    if (monthIndex <= index) sum += monthNet(month)
  }
  return sum
}
