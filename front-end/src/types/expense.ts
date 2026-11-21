import type { Currency } from '@/types/currency'

export type ExpenseCategory = string

export interface Expense {
  id: string
  title: string
  /** Amount converted to the user's display currency at today's rate. */
  amount: number
  /** Amount as entered, in `currency`. */
  originalAmount: number
  currency: Currency
  category: ExpenseCategory
  /** Purchase date (Jalali); its month is the month the expense counts in. */
  jalaliYear: number
  jalaliMonth: number
  jalaliDay: number
  note: string | null
  createdAt: string
}

/** `amount` is in `currency`. */
export type NewExpense = Omit<Expense, 'id' | 'createdAt' | 'originalAmount'>
