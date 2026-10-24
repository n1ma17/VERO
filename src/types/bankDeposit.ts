export interface BankDeposit {
  id: string
  /** Amount in Iranian Toman (integer). */
  amount: number
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

export type NewBankDeposit = Pick<
  BankDeposit,
  | 'amount'
  | 'note'
  | 'jalaliYear'
  | 'jalaliMonth'
  | 'jalaliDay'
  | 'bookedYear'
  | 'bookedMonth'
>
