import type { BankDeposit, NewBankDeposit } from '@/types/bankDeposit'
import type { Bill, NewBill } from '@/types/bill'
import type { Currency } from '@/types/currency'
import type { Expense, NewExpense } from '@/types/expense'
import type { Installment } from '@/types/installment'
import type { LedgerEntry, LedgerMonth, LedgerMonthPoint } from '@/types/ledger'
import {
  billEndIso,
  durationFromIsoSpan,
  isoToJalali,
  jalaliMonthFirstIso,
  jalaliToIsoDate,
} from '@/utils/jalali'

/** Row APIs return `amount` in the row's own `currency`. */
export interface BillApi {
  id: string
  title: string
  amount: number
  currency: Currency
  startOn: string
  endOn: string
  dueDay: number
  logoKey: string | null
  createdAt: string
}

export interface ExpenseApi {
  id: string
  title: string
  amount: number
  currency: Currency
  category: Expense['category']
  occurredOn: string
  note: string | null
  createdAt: string
}

export interface DepositApi {
  id: string
  amount: number
  currency: Currency
  arrivedOn: string
  bookedOn: string
  note: string | null
  createdAt: string
}

export interface InstallmentApi {
  id: string
  billId: string
  title: string
  amount: number
  currency: Currency
  dueDate: string
  paidAt: string | null
  logoKey: string | null
}

export interface LedgerEntryApi {
  id: string
  kind: LedgerEntry['kind']
  title: string
  detail: string | null
  amount: number
  originalAmount: number
  originalCurrency: Currency
  date: string
  balance: number
  status: LedgerEntry['status']
  installmentId: string | null
  expenseId: string | null
  category: LedgerEntry['category']
}

export interface LedgerMonthApi {
  date: string
  currency: Currency
  monthIncome: number
  monthBills: number
  monthExpenses: number
  monthSpending: number
  monthNet: number
  openingBalance: number
  closingBalance: number
  entries: LedgerEntryApi[]
  depositCount: number
  billCount: number
  expenseCount: number
  paidBillsTotal: number
  unpaidBillsTotal: number
  chartSeries: Array<{
    date: string
    label: string
    income: number
    bills: number
    expenses: number
    balance: number
  }>
}

/** Row stores convert `amount` for display; these mappers keep it as entered. */
export function billFromApi(row: BillApi): Bill {
  const start = isoToJalali(row.startOn)
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    originalAmount: row.amount,
    currency: row.currency,
    startYear: start.year,
    startMonth: start.month,
    dueDay: row.dueDay,
    durationMonths: durationFromIsoSpan(row.startOn, row.endOn),
    logoKey: row.logoKey,
    createdAt: row.createdAt,
  }
}

export function billToApi(input: NewBill & { durationMonths: number }) {
  return {
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    startOn: jalaliToIsoDate(input.startYear, input.startMonth, input.dueDay),
    endOn: billEndIso(input.startYear, input.startMonth, input.dueDay, input.durationMonths),
    dueDay: input.dueDay,
    logoUrl: input.logoUrl,
  }
}

export function expenseFromApi(row: ExpenseApi): Expense {
  const date = isoToJalali(row.occurredOn)
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    originalAmount: row.amount,
    currency: row.currency,
    category: row.category,
    jalaliYear: date.year,
    jalaliMonth: date.month,
    jalaliDay: date.day,
    note: row.note,
    createdAt: row.createdAt,
  }
}

export function expenseToApi(input: NewExpense) {
  return {
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    occurredOn: jalaliToIsoDate(input.jalaliYear, input.jalaliMonth, input.jalaliDay),
    note: input.note,
  }
}

export function depositFromApi(row: DepositApi): BankDeposit {
  const arrived = isoToJalali(row.arrivedOn)
  const booked = isoToJalali(row.bookedOn)
  return {
    id: row.id,
    amount: row.amount,
    originalAmount: row.amount,
    currency: row.currency,
    jalaliYear: arrived.year,
    jalaliMonth: arrived.month,
    jalaliDay: arrived.day,
    bookedYear: booked.year,
    bookedMonth: booked.month,
    note: row.note,
    createdAt: row.createdAt,
  }
}

export function depositToApi(input: NewBankDeposit) {
  return {
    amount: input.amount,
    currency: input.currency,
    arrivedOn: jalaliToIsoDate(input.jalaliYear, input.jalaliMonth, input.jalaliDay),
    bookedOn: jalaliMonthFirstIso(input.bookedYear, input.bookedMonth),
    note: input.note,
  }
}

export function installmentFromApi(row: InstallmentApi): Installment {
  const due = isoToJalali(row.dueDate)
  return {
    id: row.id,
    billId: row.billId,
    title: row.title,
    amount: row.amount,
    originalAmount: row.amount,
    currency: row.currency,
    dueYear: due.year,
    dueMonth: due.month,
    dueDay: due.day,
    dueDate: row.dueDate,
    paidAt: row.paidAt,
    logoKey: row.logoKey,
  }
}

function chartPointFromApi(point: LedgerMonthApi['chartSeries'][number]): LedgerMonthPoint {
  const jalali = isoToJalali(point.date)
  return {
    year: jalali.year,
    month: jalali.month,
    label: point.label,
    income: point.income,
    bills: point.bills,
    expenses: point.expenses,
    balance: point.balance,
  }
}

export function ledgerFromApi(row: LedgerMonthApi): LedgerMonth {
  const jalali = isoToJalali(row.date)
  return {
    year: jalali.year,
    month: jalali.month,
    currency: row.currency,
    monthIncome: row.monthIncome,
    monthBills: row.monthBills,
    monthExpenses: row.monthExpenses,
    monthSpending: row.monthSpending,
    monthNet: row.monthNet,
    openingBalance: row.openingBalance,
    closingBalance: row.closingBalance,
    entries: row.entries.map((entry) => {
      const date = isoToJalali(entry.date)
      return {
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        detail: entry.detail,
        amount: entry.amount,
        originalAmount: entry.originalAmount,
        originalCurrency: entry.originalCurrency,
        year: date.year,
        month: date.month,
        day: date.day,
        balance: entry.balance,
        status: entry.status,
        installmentId: entry.installmentId,
        expenseId: entry.expenseId,
        category: entry.category,
      }
    }),
    depositCount: row.depositCount,
    billCount: row.billCount,
    expenseCount: row.expenseCount,
    paidBillsTotal: row.paidBillsTotal,
    unpaidBillsTotal: row.unpaidBillsTotal,
    chartSeries: row.chartSeries.map(chartPointFromApi),
  }
}
