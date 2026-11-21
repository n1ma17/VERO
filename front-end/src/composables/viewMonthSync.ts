import { currentCalendarMonth, usesJalaliCalendar } from '@/utils/calendar'
import type { JalaliMonth } from '@/types/bill'

const VIEW_KEYS = [
  'money-managment:expenses-view-month',
  'money-managment:bills-view-month',
  'money-managment:installments-view-month',
  'money-managment:deposits-view-month',
  'money-managment:transactions-view-month',
] as const

/** Jalali years are ~13xx–14xx; Gregorian are 19xx–20xx. */
export function viewMonthMatchesCalendar(month: JalaliMonth): boolean {
  const jalali = usesJalaliCalendar()
  if (jalali) return month.year < 1700
  return month.year >= 1700
}

export function sanitizeViewMonth(stored: JalaliMonth | null | undefined): JalaliMonth {
  if (stored && viewMonthMatchesCalendar(stored)) return stored
  return currentCalendarMonth()
}

/** After currency (calendar) changes, snap every page view-month to "this month". */
export function resetViewMonthsToCurrentCalendar(): void {
  const now = currentCalendarMonth()
  const raw = JSON.stringify(now)
  for (const key of VIEW_KEYS) {
    localStorage.setItem(key, raw)
  }
}
