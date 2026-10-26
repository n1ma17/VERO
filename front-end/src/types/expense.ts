export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'home'
  | 'clothing'
  | 'entertainment'
  | 'transport'
  | 'car'
  | 'motorcycle'
  | 'beauty'
  | 'health'
  | 'other'

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
