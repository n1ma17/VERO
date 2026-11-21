import type { Currency } from '@/types/currency'

export interface BankDeposit {
  id: string
  /** Amount converted to the user's display currency at today's rate. */
  amount: number
  /** Amount as entered, in `currency`. */
  originalAmount: number
  currency: Currency
  /** When the transfer hit the bank (Jalali). */
  jalaliYear: number
  jalaliMonth: number
  jalaliDay: number
  /** Which month this deposit counts toward (e.g. salary for this month). */
  bookedYear: number
  bookedMonth: number
  note: string | null
  createdAt: string
}

/** `amount` is in `currency`. */
export type NewBankDeposit = Pick<
  BankDeposit,
  | 'amount'
  | 'currency'
  | 'note'
  | 'jalaliYear'
  | 'jalaliMonth'
  | 'jalaliDay'
  | 'bookedYear'
  | 'bookedMonth'
>
