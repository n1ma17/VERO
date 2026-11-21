import { jalaliToIso } from './calendar.js';
import type { Currency } from './currency.js';
import type {
  BankDepositDto,
  BillDto,
  ExpenseCategory,
  ExpenseDto,
  InstallmentDto,
  InstallmentStatus,
} from './types.js';

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function toDateOnly(value: Date | string): string {
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
  currency: Currency;
  start_on: Date | string;
  end_on: Date | string;
  due_day: number;
  created_at: Date | string;
  has_logo: boolean;
};

export type DepositRow = {
  id: string;
  amount: string | number;
  currency: Currency;
  arrived_on: Date | string;
  booked_on: Date | string;
  note: string | null;
  created_at: Date | string;
};

export type ExpenseRow = {
  id: string;
  title: string;
  amount: string | number;
  currency: Currency;
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
  currency: Currency;
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
  currency: Currency;
  amount_usd: string | number;
  occurred_on: Date | string;
  year: number;
  month: number;
  day: number;
  status: string | null;
  installment_id: string | null;
  expense_id: string | null;
  category: ExpenseCategory | null;
  balance_usd: string | number;
};

export function mapBill(row: BillRow): BillDto {
  return {
    id: row.id,
    title: row.title,
    amount: toNumber(row.amount),
    currency: row.currency,
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
    currency: row.currency,
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
    currency: row.currency,
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
    currency: row.currency,
    dueDate: toDateOnly(row.due_date),
    paidAt: toIso(row.paid_at),
    logoKey: row.logo_key,
    status: row.status,
  };
}

export function mapLedgerStatus(status: string | null): InstallmentStatus | null {
  if (status === 'paid' || status === 'unpaid' || status === 'overdue') return status;
  return null;
}

export function ledgerRowDate(row: LedgerRow): string {
  return row.occurred_on
    ? toDateOnly(row.occurred_on)
    : jalaliToIso(row.year, row.month, row.day);
}
