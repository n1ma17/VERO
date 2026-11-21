export type ExpenseCategory = string

export interface Expense {
  id: string
  title: string
  /** Amount in Iranian Toman (integer). */
  amount: number
  category: ExpenseCategory
  /** Purchase date (Jalali); its month is the month the expense counts in. */
  jalaliYear: number
  jalaliMonth: number
  jalaliDay: number
  note: string | null
  createdAt: string
}

export type NewExpense = Omit<Expense, 'id' | 'createdAt'>