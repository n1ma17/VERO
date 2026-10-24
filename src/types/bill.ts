export interface JalaliMonth {
  year: number
  month: number
}

export interface Bill {
  id: string
  title: string
  /** Amount in Iranian Toman (integer). */
  amount: number
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

export type NewBill = Omit<Bill, 'id' | 'createdAt' | 'logoKey' | 'logoUrl'> & {
  logoUrl?: string | null
}
