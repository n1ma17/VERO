import type { Currency } from '@/types/currency'

export interface JalaliMonth {
  year: number
  month: number
}

export interface Bill {
  id: string
  title: string
  /** Amount converted to the user's display currency at today's rate. */
  amount: number
  /** Amount as entered, in `currency`. Never changes when display currency changes. */
  originalAmount: number
  currency: Currency
  startYear: number
  startMonth: number
  /** Day of month (1–31) when the bill is due in each active Jalali month. */
  dueDay: number
  durationMonths: number
  /** IndexedDB key for optional logo (`bill-logos` store). */
  logoKey: string | null
  /** @deprecated Migrated to IndexedDB; not persisted after load. */
  logoUrl?: string | null
  createdAt: string
}

/** `amount` is in `currency`. */
export type NewBill = Omit<Bill, 'id' | 'createdAt' | 'logoKey' | 'logoUrl' | 'originalAmount'> & {
  logoUrl?: string | null
}
