import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../src/common/money/types.js';

const LOGO_CHUNK_SIZE = 30_000;
const BACKUP_FORMAT_VERSION = 1;

export type BackupBill = {
  id: string;
  title: string;
  amount: number;
  startYear: number;
  startMonth: number;
  dueDay: number;
  durationMonths: number;
  logoKey: string | null;
};

export type BackupDeposit = {
  id: string;
  amount: number;
  jalaliYear: number;
  jalaliMonth: number;
  jalaliDay: number;
  bookedYear: number;
  bookedMonth: number;
  note: string | null;
};

export type BackupExpense = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  jalaliYear: number;
  jalaliMonth: number;
  jalaliDay: number;
  note: string | null;
};

export type BackupPayment = {
  billId: string;
  year: number;
  month: number;
  paidAt: string;
};

export type BackupLogo = {
  billId: string;
  dataUrl: string;
};

export type BackupSnapshot = {
  bills: BackupBill[];
  deposits: BackupDeposit[];
  expenses: BackupExpense[];
  payments: BackupPayment[];
  logos: BackupLogo[];
};

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === 'string' &&
    (EXPENSE_CATEGORIES as readonly string[]).includes(value)
  );
}

function rowsFromSheet<T>(wb: XLSX.WorkBook, name: string): T[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: null });
}

function reassembleLogos(
  rows: { logoKey?: string; chunkIndex?: number; chunk?: string }[],
): BackupLogo[] {
  const byKey = new Map<string, { index: number; chunk: string }[]>();
  for (const row of rows) {
    const logoKey = row.logoKey;
    const chunk = row.chunk;
    if (!logoKey || chunk === undefined) continue;
    const chunkIndex = Number(row.chunkIndex ?? 0);
    const list = byKey.get(logoKey) ?? [];
    list.push({ index: chunkIndex, chunk: String(chunk) });
    byKey.set(logoKey, list);
  }
  return [...byKey.entries()].map(([billId, parts]) => ({
    billId,
    dataUrl: parts.sort((a, b) => a.index - b.index).map((p) => p.chunk).join(''),
  }));
}

function parsePaymentKey(key: string): { billId: string; year: number; month: number } | null {
  const separator = key.lastIndexOf(':');
  if (separator <= 0) return null;
  const billId = key.slice(0, separator);
  const [yearPart, monthPart] = key.slice(separator + 1).split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!billId || !Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { billId, year, month };
}

export function parseBackupWorkbook(wb: XLSX.WorkBook): BackupSnapshot {
  const infoRows = rowsFromSheet<{ field?: string; value?: unknown }>(wb, 'Info');
  const info = new Map(
    infoRows.filter((r) => r.field).map((r) => [String(r.field), r.value]),
  );
  void Number(info.get('formatVersion') ?? BACKUP_FORMAT_VERSION);

  const bills = rowsFromSheet<Record<string, unknown>>(wb, 'Bills')
    .filter((row) => row.id && row.title)
    .map((row) => ({
      id: String(row.id),
      title: String(row.title),
      amount: Math.round(Number(row.amount) || 0),
      startYear: Number(row.startYear) || 1400,
      startMonth: Number(row.startMonth) || 1,
      dueDay: Number(row.dueDay) || 1,
      durationMonths: Math.min(
        60,
        Math.max(1, Math.round(Number(row.durationMonths) || 1)),
      ),
      logoKey: row.logoKey ? String(row.logoKey) : null,
    }));

  const deposits = rowsFromSheet<Record<string, unknown>>(wb, 'Deposits')
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
    }));

  const expenses = rowsFromSheet<Record<string, unknown>>(wb, 'Expenses')
    .filter((row) => row.id && row.title)
    .map((row) => ({
      id: String(row.id),
      title: String(row.title),
      amount: Math.round(Number(row.amount) || 0),
      category: isExpenseCategory(row.category) ? row.category : 'other',
      jalaliYear: Number(row.jalaliYear) || 1400,
      jalaliMonth: Number(row.jalaliMonth) || 1,
      jalaliDay: Number(row.jalaliDay) || 1,
      note: row.note ? String(row.note) : null,
    }));

  const payments: BackupPayment[] = [];
  for (const row of rowsFromSheet<Record<string, unknown>>(wb, 'Payments')) {
    if (!row.paymentKey || !row.paidAt) continue;
    const parsed = parsePaymentKey(String(row.paymentKey));
    if (!parsed) continue;
    payments.push({ ...parsed, paidAt: String(row.paidAt) });
  }

  const logos = reassembleLogos(rowsFromSheet(wb, 'LogoChunks'));

  if (
    !bills.length &&
    !deposits.length &&
    !expenses.length &&
    !payments.length
  ) {
    throw new Error(
      'Backup has no Bills, Deposits, Expenses, or Payments sheets with data.',
    );
  }

  return { bills, deposits, expenses, payments, logos };
}

export function loadBackupFromFile(filePath: string): BackupSnapshot {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  return parseBackupWorkbook(wb);
}
