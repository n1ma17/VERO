import { displayCurrency } from '@/composables/useCurrency'
import type { Bill, JalaliMonth } from '@/types/bill'
import { toIsoDate } from '@/utils/date'
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_NAMES,
  addJalaliMonths,
  billDueInMonth,
  buildMonthDayGrid as buildJalaliMonthDayGrid,
  compareJalaliDates,
  currentJalaliDate,
  currentJalaliMonth,
  formatJalaliDate,
  formatJalaliMonth,
  formatJalaliMonthRange,
  formatIsoAsJalali,
  formatTimestampAsJalali,
  indexToMonth,
  isJalaliDateBeforeToday,
  jalaliMonthFirstIso,
  jalaliMonthLength,
  jalaliToIsoDate,
  jalaliWeekdayIndex,
  monthToIndex,
  isoToJalali,
} from '@/utils/jalali'

export type CalendarMonth = JalaliMonth
export type CalendarDate = { year: number; month: number; day: number }

export const GREGORIAN_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Monday-first week, matching common Gregorian pickers. */
export const GREGORIAN_WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Display + pickers use Jalali when the user's currency is IRR; otherwise Gregorian. */
export function usesJalaliCalendar(): boolean {
  return displayCurrency() === 'IRR'
}

export function calendarMonthNames(): readonly string[] {
  return usesJalaliCalendar() ? JALALI_MONTH_NAMES : GREGORIAN_MONTH_NAMES
}

export function calendarWeekdayNames(): readonly string[] {
  return usesJalaliCalendar() ? JALALI_WEEKDAY_NAMES : GREGORIAN_WEEKDAY_NAMES
}

export function calendarLabel(): string {
  return usesJalaliCalendar() ? 'Jalali calendar' : 'Gregorian calendar'
}

export { monthToIndex, indexToMonth }

export function addCalendarMonths(year: number, month: number, delta: number): CalendarMonth {
  return indexToMonth(monthToIndex(year, month) + delta)
}

export function previousCalendarMonth(year: number, month: number): CalendarMonth {
  return addCalendarMonths(year, month, -1)
}

export function nextCalendarMonth(year: number, month: number): CalendarMonth {
  return addCalendarMonths(year, month, 1)
}

export function currentCalendarMonth(): CalendarMonth {
  if (usesJalaliCalendar()) return currentJalaliMonth()
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
export function isBeforeCurrentCalendarMonth(year: number, month: number): boolean {
  const now = currentCalendarMonth()
  return monthToIndex(year, month) < monthToIndex(now.year, now.month)
}


export function currentCalendarDate(): CalendarDate {
  if (usesJalaliCalendar()) return currentJalaliDate()
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

export function calendarMonthLength(year: number, month: number): number {
  if (usesJalaliCalendar()) return jalaliMonthLength(year, month)
  return new Date(year, month, 0).getDate()
}

export function clampCalendarDay(day: number, year: number, month: number): number {
  const max = calendarMonthLength(year, month)
  return Math.min(max, Math.max(1, Math.round(day)))
}

/** Weekday index for the calendar grid: Jalali Sat=0…Fri=6; Gregorian Mon=0…Sun=6. */
export function calendarWeekdayIndex(year: number, month: number, day: number): number {
  if (usesJalaliCalendar()) return jalaliWeekdayIndex(year, month, day)
  const jsDay = new Date(year, month - 1, day).getDay() // Sun=0…Sat=6
  return (jsDay + 6) % 7 // Mon=0…Sun=6
}

export function buildCalendarMonthDayGrid(year: number, month: number): (number | null)[] {
  if (usesJalaliCalendar()) return buildJalaliMonthDayGrid(year, month)
  const length = calendarMonthLength(year, month)
  const leading = calendarWeekdayIndex(year, month, 1)
  const cells: (number | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let day = 1; day <= length; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function formatCalendarMonth(year: number, month: number): string {
  if (usesJalaliCalendar()) return formatJalaliMonth(year, month)
  const name = GREGORIAN_MONTH_NAMES[month - 1]
  return `${name} ${year}`
}

export function formatCalendarDate(year: number, month: number, day: number): string {
  if (usesJalaliCalendar()) return formatJalaliDate(year, month, day)
  const safeDay = clampCalendarDay(day, year, month)
  return `${safeDay} ${GREGORIAN_MONTH_NAMES[month - 1]} ${year}`
}

export function formatCalendarMonthRange(
  startYear: number,
  startMonth: number,
  durationMonths: number,
): string {
  if (usesJalaliCalendar()) return formatJalaliMonthRange(startYear, startMonth, durationMonths)
  if (durationMonths <= 1) return formatCalendarMonth(startYear, startMonth)
  const end = addCalendarMonths(startYear, startMonth, durationMonths - 1)
  return `${formatCalendarMonth(startYear, startMonth)} to ${formatCalendarMonth(end.year, end.month)}`
}

export function formatIsoAsCalendar(iso: string): string {
  if (usesJalaliCalendar()) return formatIsoAsJalali(iso)
  const { year, month, day } = isoToCalendar(iso)
  return formatCalendarDate(year, month, day)
}

export function formatTimestampAsCalendar(iso: string): string {
  if (usesJalaliCalendar()) return formatTimestampAsJalali(iso)
  const date = new Date(iso)
  return formatCalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function calendarToIsoDate(year: number, month: number, day: number): string {
  if (usesJalaliCalendar()) return jalaliToIsoDate(year, month, day)
  const safeDay = clampCalendarDay(day, year, month)
  return toIsoDate(new Date(year, month - 1, safeDay))
}

export function isoToCalendar(iso: string): CalendarDate {
  if (usesJalaliCalendar()) return isoToJalali(iso)
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return { year, month, day }
}

export function calendarMonthFirstIso(year: number, month: number): string {
  if (usesJalaliCalendar()) return jalaliMonthFirstIso(year, month)
  return calendarToIsoDate(year, month, 1)
}

export function billEndIso(
  startYear: number,
  startMonth: number,
  dueDay: number,
  durationMonths: number,
): string {
  if (usesJalaliCalendar()) {
    const end = addJalaliMonths(startYear, startMonth, durationMonths - 1)
    return jalaliToIsoDate(end.year, end.month, dueDay)
  }
  const end = addCalendarMonths(startYear, startMonth, durationMonths - 1)
  return calendarToIsoDate(end.year, end.month, dueDay)
}

export function durationFromIsoSpan(startOn: string, endOn: string): number {
  const start = isoToCalendar(startOn)
  const end = isoToCalendar(endOn)
  return monthToIndex(end.year, end.month) - monthToIndex(start.year, start.month) + 1
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (usesJalaliCalendar()) return compareJalaliDates(a, b)
  const key = (d: CalendarDate) => d.year * 10000 + d.month * 100 + d.day
  return key(a) - key(b)
}

export function isCalendarDateBeforeToday(year: number, month: number, day: number): boolean {
  if (usesJalaliCalendar()) return isJalaliDateBeforeToday(year, month, day)
  return compareCalendarDates({ year, month, day }, currentCalendarDate()) < 0
}

export function billDueInCalendarMonth(
  bill: Pick<Bill, 'dueDay'>,
  year: number,
  month: number,
): CalendarDate {
  if (usesJalaliCalendar()) return billDueInMonth(bill, year, month)
  return { year, month, day: clampCalendarDay(bill.dueDay, year, month) }
}

export function isBillActiveInCalendarMonth(
  bill: Pick<Bill, 'startYear' | 'startMonth' | 'durationMonths'>,
  year: number,
  month: number,
): boolean {
  const view = monthToIndex(year, month)
  const start = monthToIndex(bill.startYear, bill.startMonth)
  const end = start + bill.durationMonths - 1
  return view >= start && view <= end
}

/** @deprecated Use isBillActiveInCalendarMonth */
export { isBillActiveInMonth } from '@/utils/jalali'

/** Alias so call sites can keep a short name while respecting calendar mode. */
export const clampDueDay = clampCalendarDay
