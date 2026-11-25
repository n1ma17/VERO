import type { Currency } from '@/types/currency'

export type InstallmentStatus = 'paid' | 'unpaid' | 'overdue'

export interface Installment {
  id: string
  billId: string
  title: string
  /** Amount converted to the user's display currency at today's rate. */
  amount: number
  /** Bill amount as entered, in `currency`. */
  originalAmount: number
  currency: Currency
  dueYear: number
  dueMonth: number
  dueDay: number
  /** Gregorian `YYYY-MM-DD` for overdue logic. */
  dueDate: string
  paidAt: string | null
  companyId: string | null
  companyName: string | null
  logoKey: string | null
}
