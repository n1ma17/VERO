import { toGregorian, toJalaali } from 'jalaali-js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export function jalaliToIso(year: number, month: number, day: number): string {
  const { gy, gm, gd } = toGregorian(year, month, day);
  return toIsoParts(gy, gm, gd);
}

export function isoToJalali(iso: string): { year: number; month: number; day: number } {
  const [gy, gm, gd] = iso.slice(0, 10).split('-').map(Number);
  const { jy, jm, jd } = toJalaali(gy, gm, gd);
  return { year: jy, month: jm, day: jd };
}

export function jalaliMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function addJalaliMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = jalaliMonthIndex(year, month) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function billEndIso(
  startYear: number,
  startMonth: number,
  dueDay: number,
  durationMonths: number,
): string {
  const end = addJalaliMonths(startYear, startMonth, durationMonths - 1);
  return jalaliToIso(end.year, end.month, dueDay);
}

export function durationFromSpan(startOn: string, endOn: string): number {
  const start = isoToJalali(startOn);
  const end = isoToJalali(endOn);
  return jalaliMonthIndex(end.year, end.month) - jalaliMonthIndex(start.year, start.month) + 1;
}

export function jalaliMonthFirstIso(year: number, month: number): string {
  return jalaliToIso(year, month, 1);
}

function toIsoParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
