import type {
  BankDepositDto,
  BillDto,
  ExpenseCategory,
  ExpenseDto,
  InstallmentDto,
  InstallmentStatus,
  LedgerEntryDto,
} from './types.js';

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toDateOnly(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toNumber(value: unknown): number {
  return Number(value);
}

export type BillRow = {
  id: string;
  title: string;
  amount: string | number;
  start_year: number;
  start_month: number;
  due_day: number;
  duration_months: number;
  created_at: Date | string;
  has_logo: boolean;
};

export type DepositRow = {
  id: string;
  amount: string | number;
  jalali_year: number;
  jalali_month: number;
  jalali_day: number;
  booked_year: number;
  booked_month: number;
  note: string | null;
  created_at: Date | string;
};

export type ExpenseRow = {
  id: string;
  title: string;
  amount: string | number;
  category: ExpenseCategory;
  jalali_year: number;
  jalali_month: number;
  jalali_day: number;
  note: string | null;
  created_at: Date | string;
};

export type InstallmentRow = {
  id: string;
  bill_id: string;
  title: string;
  amount: string | number;
  due_year: number;
  due_month: number;
  due_day: number;
  due_date: Date | string;
  paid_at: Date | string | null;
  logo_key: string | null;
  status: InstallmentStatus;
};

export type LedgerRow = {
  id: string;
  kind: 'deposit' | 'bill' | 'expense';
  title: string;
  detail: string | null;
  amount: string | number;
  year: number;
  month: number;
  day: number;
  status: string | null;
  installment_id: string | null;
  expense_id: string | null;
  category: ExpenseCategory | null;
  balance: string | number;
};

export function mapBill(row: BillRow): BillDto {
  return {
    id: row.id,
    title: row.title,
    amount: toNumber(row.amount),
    startYear: row.start_year,
    startMonth: row.start_month,
    dueDay: row.due_day,
    durationMonths: row.duration_months,
    logoKey: row.has_logo ? row.id : null,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

export function mapDeposit(row: DepositRow): BankDepositDto {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    jalaliYear: row.jalali_year,
    jalaliMonth: row.jalali_month,
    jalaliDay: row.jalali_day,
    bookedYear: row.booked_year,
    bookedMonth: row.booked_month,
    note: row.note,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

export function mapExpense(row: ExpenseRow): ExpenseDto {
  return {
    id: row.id,
    title: row.title,
    amount: toNumber(row.amount),
    category: row.category,
    jalaliYear: row.jalali_year,
    jalaliMonth: row.jalali_month,
    jalaliDay: row.jalali_day,
    note: row.note,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

export function mapInstallment(row: InstallmentRow): InstallmentDto {
  return {
    id: row.id,
    billId: row.bill_id,
    title: row.title,
    amount: toNumber(row.amount),
    dueYear: row.due_year,
    dueMonth: row.due_month,
    dueDay: row.due_day,
    dueDate: toDateOnly(row.due_date),
    paidAt: toIso(row.paid_at),
    logoKey: row.logo_key,
    status: row.status,
  };
}

export function mapLedgerEntry(row: LedgerRow): LedgerEntryDto {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    amount: toNumber(row.amount),
    year: row.year,
    month: row.month,
    day: row.day,
    status: row.status,
    installmentId: row.installment_id,
    expenseId: row.expense_id,
    category: row.category,
    balance: toNumber(row.balance),
  };
}
