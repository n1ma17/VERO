import { jalaaliMonthLength, jalaaliToDateObject, toGregorian, toJalaali } from 'jalaali-js'
import { toIsoDate } from '@/utils/date'
import type { Bill, JalaliMonth } from '@/types/bill'

/** Jalali month names (English transliteration). */
export const JALALI_MONTH_NAMES = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
] as const

export const JALALI_WEEKDAY_NAMES = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export function toPersianDigits(value: string | number): string {
  const digits = '۰۱۲۳۴۵۶۷۸۹'
  return String(value).replace(/\d/g, (d) => digits[Number(d)])
}

export function monthToIndex(year: number, month: number): number {
  return year * 12 + (month - 1)
}

export function indexToMonth(index: number): JalaliMonth {
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return { year, month }
}

export function addJalaliMonths(year: number, month: number, delta: number): JalaliMonth {
  return indexToMonth(monthToIndex(year, month) + delta)
}

export function previousJalaliMonth(year: number, month: number): JalaliMonth {
  return addJalaliMonths(year, month, -1)
}

export function nextJalaliMonth(year: number, month: number): JalaliMonth {
  return addJalaliMonths(year, month, 1)
}

export function currentJalaliMonth(): JalaliMonth {
  const today = toJalaali(new Date())
  return { year: today.jy, month: today.jm }
}

export function currentJalaliDate() {
  const today = toJalaali(new Date())
  return { year: today.jy, month: today.jm, day: today.jd }
}

/** Saturday = 0 … Friday = 6 (Iranian week). */
export function jalaliWeekdayIndex(year: number, month: number, day: number): number {
  const jsDay = jalaaliToDateObject(year, month, day).getDay()
  return (jsDay + 1) % 7
}

export function jalaliMonthLength(year: number, month: number): number {
  return jalaaliMonthLength(year, month)
}

export function clampDueDay(day: number, year: number, month: number): number {
  const max = jalaaliMonthLength(year, month)
  return Math.min(max, Math.max(1, Math.round(day)))
}

export function formatJalaliMonth(year: number, month: number): string {
  const name = JALALI_MONTH_NAMES[month - 1]
  return `${name} ${year}`
}

export function formatJalaliDate(year: number, month: number, day: number): string {
  const safeDay = clampDueDay(day, year, month)
  return `${safeDay} ${JALALI_MONTH_NAMES[month - 1]} ${year}`
}

export function formatJalaliMonthRange(
  startYear: number,
  startMonth: number,
  durationMonths: number,
): string {
  if (durationMonths <= 1) return formatJalaliMonth(startYear, startMonth)
  const end = addJalaliMonths(startYear, startMonth, durationMonths - 1)
  return `${formatJalaliMonth(startYear, startMonth)} to ${formatJalaliMonth(end.year, end.month)}`
}

export function isBillActiveInMonth(
  bill: Pick<Bill, 'startYear' | 'startMonth' | 'durationMonths'>,
  year: number,
  month: number,
): boolean {
  const view = monthToIndex(year, month)
  const start = monthToIndex(bill.startYear, bill.startMonth)
  const end = start + bill.durationMonths - 1
  return view >= start && view <= end
}

export function billDueInMonth(
  bill: Pick<Bill, 'dueDay'>,
  year: number,
  month: number,
): { year: number; month: number; day: number } {
  return { year, month, day: clampDueDay(bill.dueDay, year, month) }
}

export function compareJalaliDates(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
): number {
  const key = (d: { year: number; month: number; day: number }) =>
    d.year * 10000 + d.month * 100 + d.day
  return key(a) - key(b)
}

export function isJalaliDateBeforeToday(year: number, month: number, day: number): boolean {
  const today = currentJalaliDate()
  return compareJalaliDates({ year, month, day }, today) < 0
}

/** Gregorian `YYYY-MM-DD` for a Jalali due date (status comparisons). */
export function jalaliToIsoDate(year: number, month: number, day: number): string {
  const safeDay = clampDueDay(day, year, month)
  const { gy, gm, gd } = toGregorian(year, month, safeDay)
  return toIsoDate(new Date(gy, gm - 1, gd))
}

/** Jalali year/month/day from a Gregorian `YYYY-MM-DD` (or ISO timestamp). */
export function isoToJalali(iso: string): { year: number; month: number; day: number } {
  const [gy, gm, gd] = iso.slice(0, 10).split('-').map(Number)
  const { jy, jm, jd } = toJalaali(gy, gm, gd)
  return { year: jy, month: jm, day: jd }
}

export function formatIsoAsJalali(iso: string): string {
  const { year, month, day } = isoToJalali(iso)
  return formatJalaliDate(year, month, day)
}

/** Format a timestamptz / ISO timestamp as a Jalali calendar date (local). */
export function formatTimestampAsJalali(iso: string): string {
  const { jy, jm, jd } = toJalaali(new Date(iso))
  return formatJalaliDate(jy, jm, jd)
}

export function jalaliMonthFirstIso(year: number, month: number): string {
  return jalaliToIsoDate(year, month, 1)
}

export function billEndIso(
  startYear: number,
  startMonth: number,
  dueDay: number,
  durationMonths: number,
): string {
  const end = addJalaliMonths(startYear, startMonth, durationMonths - 1)
  return jalaliToIsoDate(end.year, end.month, dueDay)
}

export function durationFromIsoSpan(startOn: string, endOn: string): number {
  const start = isoToJalali(startOn)
  const end = isoToJalali(endOn)
  return monthToIndex(end.year, end.month) - monthToIndex(start.year, start.month) + 1
}

export function buildMonthDayGrid(year: number, month: number): (number | null)[] {
  const length = jalaaliMonthLength(year, month)
  const leading = jalaliWeekdayIndex(year, month, 1)
  const cells: (number | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let day = 1; day <= length; day++) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
