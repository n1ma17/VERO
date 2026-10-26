import type { Bill } from '@/types/bill'
import type { Installment } from '@/types/installment'
import {
  addJalaliMonths,
  billDueInMonth,
  jalaliToIsoDate,
} from '@/utils/jalali'

export function installmentPaymentKey(billId: string, year: number, month: number): string {
  const monthPart = String(month).padStart(2, '0')
  return `${billId}:${year}-${monthPart}`
}

export function encodeInstallmentId(billId: string, year: number, month: number): string {
  const monthPart = String(month).padStart(2, '0')
  return `${billId}__${year}-${monthPart}`
}

export function parseInstallmentId(
  id: string,
): { billId: string; year: number; month: number } | null {
  const separator = id.lastIndexOf('__')
  if (separator <= 0) return null

  const billId = id.slice(0, separator)
  const [yearPart, monthPart] = id.slice(separator + 2).split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (!billId || !Number.isFinite(year) || !Number.isFinite(month)) return null
  return { billId, year, month }
}

export function buildInstallmentsFromBills(
  bills: Bill[],
  payments: Record<string, string>,
): Installment[] {
  const items: Installment[] = []

  for (const bill of bills) {
    for (let offset = 0; offset < bill.durationMonths; offset++) {
      const { year, month } = addJalaliMonths(bill.startYear, bill.startMonth, offset)
      const due = billDueInMonth(bill, year, month)
      const payKey = installmentPaymentKey(bill.id, year, month)

      items.push({
        id: encodeInstallmentId(bill.id, year, month),
        billId: bill.id,
        title: bill.title,
        amount: bill.amount,
        dueYear: due.year,
        dueMonth: due.month,
        dueDay: due.day,
        dueDate: jalaliToIsoDate(due.year, due.month, due.day),
        paidAt: payments[payKey] ?? null,
        logoKey: bill.logoKey,
      })
    }
  }

  return items
}
