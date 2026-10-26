import { jalaliToIso } from './calendar.js';
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
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toNumber(value: unknown): number {
  return Number(value);
}

export type BillRow = {
  id: string;
  title: string;
  amount: string | number;
  start_on: Date | string;
  end_on: Date | string;
  due_day: number;
  created_at: Date | string;
  has_logo: boolean;
};

export type DepositRow = {
  id: string;
  amount: string | number;
  arrived_on: Date | string;
  booked_on: Date | string;
  note: string | null;
  created_at: Date | string;
};

export type ExpenseRow = {
  id: string;
  title: string;
  amount: string | number;
  category: ExpenseCategory;
  occurred_on: Date | string;
  note: string | null;
  created_at: Date | string;
};

export type InstallmentRow = {
  id: string;
  bill_id: string;
  title: string;
  amount: string | number;
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
  occurred_on: Date | string;
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
    startOn: toDateOnly(row.start_on),
    endOn: toDateOnly(row.end_on),
    dueDay: row.due_day,
    logoKey: row.has_logo ? row.id : null,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  };
}

export function mapDeposit(row: DepositRow): BankDepositDto {
  return {
    id: row.id,
    amount: toNumber(row.amount),
    arrivedOn: toDateOnly(row.arrived_on),
    bookedOn: toDateOnly(row.booked_on),
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
    occurredOn: toDateOnly(row.occurred_on),
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
    dueDate: toDateOnly(row.due_date),
    paidAt: toIso(row.paid_at),
    logoKey: row.logo_key,
    status: row.status,
  };
}

function mapLedgerStatus(status: string | null): InstallmentStatus | null {
  if (status === 'paid' || status === 'unpaid' || status === 'overdue') return status;
  return null;
}

export function mapLedgerEntry(row: LedgerRow): LedgerEntryDto {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    amount: toNumber(row.amount),
    date: row.occurred_on
      ? toDateOnly(row.occurred_on)
      : jalaliToIso(row.year, row.month, row.day),
    status: mapLedgerStatus(row.status),
    installmentId: row.installment_id,
    expenseId: row.expense_id,
    category: row.category,
    balance: toNumber(row.balance),
  };
}
