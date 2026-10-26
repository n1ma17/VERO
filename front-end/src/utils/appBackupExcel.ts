import * as XLSX from 'xlsx'
import { api } from '@/api/http'
import { logoToDataUrl } from '@/composables/useBillLogos'
import { getBillsSnapshot } from '@/composables/useBills'
import { getDepositsSnapshot } from '@/composables/useBankDeposits'
import { getExpensesSnapshot } from '@/composables/useExpenses'
import { getInstallmentsSnapshot } from '@/composables/useInstallments'
import { loadMoneyCollections } from '@/composables/loadMoneyCollections'
import type { Bill } from '@/types/bill'
import type { BankDeposit } from '@/types/bankDeposit'
import type { Expense } from '@/types/expense'
import { BACKUP_FORMAT_VERSION } from '@/utils/appDataKeys'
import { installmentPaymentKey } from '@/utils/billInstallments'
import { isExpenseCategory } from '@/utils/expenseCategories'
import { billToApi, depositToApi, expenseToApi } from '@/utils/moneyApi'
import { jalaliToIsoDate } from '@/utils/jalali'

const LOGO_CHUNK_SIZE = 30_000

export interface AppBackupSnapshot {
  version: number
  exportedAt: string
  bills: Bill[]
  deposits: BankDeposit[]
  expenses: Expense[]
  installmentPayments: Record<string, string>
  logos: { key: string; dataUrl: string }[]
}

export interface BackupCounts {
  bills: number
  deposits: number
  expenses: number
  payments: number
  logos: number
}

export async function collectAppBackupSnapshot(): Promise<AppBackupSnapshot> {
  const bills = getBillsSnapshot().map((bill) => ({
    ...bill,
    dueDay: bill.dueDay ?? 1,
    logoKey: bill.logoKey ?? null,
  }))
  const deposits = getDepositsSnapshot()
  const expenses = getExpensesSnapshot().map((expense) => ({
    ...expense,
    category: isExpenseCategory(expense.category) ? expense.category : 'other',
  }))
  const installmentPayments: Record<string, string> = {}
  for (const installment of getInstallmentsSnapshot()) {
    if (!installment.paidAt) continue
    installmentPayments[
      installmentPaymentKey(installment.billId, installment.dueYear, installment.dueMonth)
    ] = installment.paidAt
  }
  const logos: { key: string; dataUrl: string }[] = []
  for (const bill of bills) {
    if (!bill.logoKey) continue
    const dataUrl = await logoToDataUrl(bill.logoKey)
    if (dataUrl) logos.push({ key: bill.logoKey, dataUrl })
  }

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    bills,
    deposits,
    expenses,
    installmentPayments,
    logos,
  }
}

function logoChunks(logos: AppBackupSnapshot['logos']) {
  const rows: { logoKey: string; chunkIndex: number; chunk: string }[] = []
  for (const { key, dataUrl } of logos) {
    if (!dataUrl) continue
    if (dataUrl.length <= LOGO_CHUNK_SIZE) {
      rows.push({ logoKey: key, chunkIndex: 0, chunk: dataUrl })
      continue
    }
    let index = 0
    for (let offset = 0; offset < dataUrl.length; offset += LOGO_CHUNK_SIZE) {
      rows.push({
        logoKey: key,
        chunkIndex: index++,
        chunk: dataUrl.slice(offset, offset + LOGO_CHUNK_SIZE),
      })
    }
  }
  return rows
}

function reassembleLogos(
  rows: { logoKey?: string; chunkIndex?: number; chunk?: string }[],
): { key: string; dataUrl: string }[] {
  const byKey = new Map<string, { index: number; chunk: string }[]>()
  for (const row of rows) {
    const logoKey = row.logoKey
    const chunk = row.chunk
    if (!logoKey || chunk === undefined) continue
    const chunkIndex = Number(row.chunkIndex ?? 0)
    const list = byKey.get(logoKey) ?? []
    list.push({ index: chunkIndex, chunk: String(chunk) })
    byKey.set(logoKey, list)
  }
  return [...byKey.entries()].map(([key, parts]) => ({
    key,
    dataUrl: parts.sort((a, b) => a.index - b.index).map((p) => p.chunk).join(''),
  }))
}

export function snapshotToWorkbook(snapshot: AppBackupSnapshot): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['field', 'value'],
      ['formatVersion', snapshot.version],
      ['exportedAt', snapshot.exportedAt],
      ['app', 'money-managment'],
    ]),
    'Info',
  )

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snapshot.bills), 'Bills')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snapshot.deposits), 'Deposits')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snapshot.expenses), 'Expenses')

  const paymentRows = Object.entries(snapshot.installmentPayments).map(([paymentKey, paidAt]) => ({
    paymentKey,
    paidAt,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payments')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logoChunks(snapshot.logos)), 'LogoChunks')

  return wb
}

export async function exportAppBackupExcel(): Promise<BackupCounts> {
  const snapshot = await collectAppBackupSnapshot()
  const wb = snapshotToWorkbook(snapshot)
  const stamp = snapshot.exportedAt.slice(0, 10)
  XLSX.writeFile(wb, `money-management-backup-${stamp}.xlsx`)
  return backupCounts(snapshot)
}

function rowsFromSheet<T>(wb: XLSX.WorkBook, name: string): T[] {
  const sheet = wb.Sheets[name]
  if (!sheet) return []
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: null })
}

function parseBills(rows: Record<string, unknown>[]): Bill[] {
  return rows
    .filter((row) => row.id && row.title)
    .map((row) => ({
      id: String(row.id),
      title: String(row.title),
      amount: Math.round(Number(row.amount) || 0),
      startYear: Number(row.startYear) || 1400,
      startMonth: Number(row.startMonth) || 1,
      dueDay: Number(row.dueDay) || 1,
      durationMonths: Math.min(60, Math.max(1, Math.round(Number(row.durationMonths) || 1))),
      logoKey: row.logoKey ? String(row.logoKey) : null,
      createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
    }))
}

function parseDeposits(rows: Record<string, unknown>[]): BankDeposit[] {
  return rows
    .filter((row) => row.id)
    .map((row) => ({
      id: String(row.id),
      amount: Math.round(Number(row.amount) || 0),
      jalaliYear: Number(row.jalaliYear) || 1400,
      jalaliMonth: Number(row.jalaliMonth) || 1,
      jalaliDay: Number(row.jalaliDay) || 1,
      bookedYear: Number(row.bookedYear) || Number(row.jalaliYear) || 1400,
      bookedMonth: Number(row.bookedMonth) || Number(row.jalaliMonth) || 1,
      note: row.note ? String(row.note) : null,
      createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
    }))
}

function parseExpenses(rows: Record<string, unknown>[]): Expense[] {
  return rows
    .filter((row) => row.id && row.title)
    .map((row) => {
      const category = row.category
      return {
        id: String(row.id),
        title: String(row.title),
        amount: Math.round(Number(row.amount) || 0),
        category: isExpenseCategory(category) ? category : 'other',
        jalaliYear: Number(row.jalaliYear) || 1400,
        jalaliMonth: Number(row.jalaliMonth) || 1,
        jalaliDay: Number(row.jalaliDay) || 1,
        note: row.note ? String(row.note) : null,
        createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
      }
    })
}

function parsePayments(rows: Record<string, unknown>[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const row of rows) {
    if (!row.paymentKey || !row.paidAt) continue
    map[String(row.paymentKey)] = String(row.paidAt)
  }
  return map
}

export function parseAppBackupWorkbook(wb: XLSX.WorkBook): AppBackupSnapshot {
  const infoRows = rowsFromSheet<{ field?: string; value?: unknown }>(wb, 'Info')
  const info = new Map(
    infoRows.filter((r) => r.field).map((r) => [String(r.field), r.value]),
  )
  const version = Number(info.get('formatVersion') ?? BACKUP_FORMAT_VERSION)

  const bills = parseBills(rowsFromSheet(wb, 'Bills'))
  const deposits = parseDeposits(rowsFromSheet(wb, 'Deposits'))
  const expenses = parseExpenses(rowsFromSheet(wb, 'Expenses'))
  const installmentPayments = parsePayments(rowsFromSheet(wb, 'Payments'))
  const logos = reassembleLogos(rowsFromSheet(wb, 'LogoChunks'))

  if (!bills.length && !deposits.length && !expenses.length && !Object.keys(installmentPayments).length) {
    throw new Error('This file has no recognizable backup sheets (Bills, Deposits, Expenses, Payments).')
  }

  return {
    version,
    exportedAt: info.get('exportedAt') ? String(info.get('exportedAt')) : new Date().toISOString(),
    bills,
    deposits,
    expenses,
    installmentPayments,
    logos,
  }
}

export function backupCounts(snapshot: AppBackupSnapshot): BackupCounts {
  return {
    bills: snapshot.bills.length,
    deposits: snapshot.deposits.length,
    expenses: snapshot.expenses.length,
    payments: Object.keys(snapshot.installmentPayments).length,
    logos: snapshot.logos.length,
  }
}

function parsePaymentKey(key: string): { billId: string; year: number; month: number } | null {
  const separator = key.lastIndexOf(':')
  if (separator <= 0) return null
  const billId = key.slice(0, separator)
  const [yearPart, monthPart] = key.slice(separator + 1).split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (!billId || !Number.isFinite(year) || !Number.isFinite(month)) return null
  return { billId, year, month }
}

export async function applyAppBackupSnapshot(snapshot: AppBackupSnapshot): Promise<void> {
  const billsById = new Map(snapshot.bills.map((bill) => [bill.id, bill]))
  const payments = Object.entries(snapshot.installmentPayments).flatMap(([key, paidAt]) => {
    const parsed = parsePaymentKey(key)
    if (!parsed) return []
    const bill = billsById.get(parsed.billId)
    const dueDay = bill?.dueDay ?? 1
    return [
      {
        billId: parsed.billId,
        dueOn: jalaliToIsoDate(parsed.year, parsed.month, dueDay),
        paidAt,
      },
    ]
  })

  await api('/api/wallet', {
    method: 'PUT',
    body: JSON.stringify({
      bills: snapshot.bills.map((bill) => ({
        id: bill.id,
        ...billToApi({
          title: bill.title,
          amount: bill.amount,
          startYear: bill.startYear,
          startMonth: bill.startMonth,
          dueDay: bill.dueDay,
          durationMonths: bill.durationMonths,
        }),
      })),
      deposits: snapshot.deposits.map((deposit) => ({
        id: deposit.id,
        ...depositToApi(deposit),
      })),
      expenses: snapshot.expenses.map((expense) => ({
        id: expense.id,
        ...expenseToApi(expense),
      })),
      payments,
      logos: snapshot.logos.map((logo) => ({ billId: logo.key, dataUrl: logo.dataUrl })),
    }),
  })
  await loadMoneyCollections()
}

export async function readAppBackupFile(file: File): Promise<AppBackupSnapshot> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  return parseAppBackupWorkbook(wb)
}
