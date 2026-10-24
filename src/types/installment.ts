export type InstallmentStatus = 'paid' | 'unpaid' | 'overdue'

export interface Installment {
  id: string
  billId: string
  title: string
  amount: number
  dueYear: number
  dueMonth: number
  dueDay: number
  /** Gregorian `YYYY-MM-DD` for overdue logic. */
  dueDate: string
  paidAt: string | null
  logoKey: string | null
}
