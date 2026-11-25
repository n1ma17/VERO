import type { Currency, FxRates } from './currency.js';

/** Default slugs shipped with the app; the API accepts any `[a-z][a-z0-9-]{0,47}` slug. */
export const EXPENSE_CATEGORY_DEFAULTS = [
  'food',
  'groceries',
  'home',
  'clothing',
  'entertainment',
  'transport',
  'car',
  'motorcycle',
  'beauty',
  'health',
  'other',
] as const;

export type ExpenseCategory = string;

export type InstallmentStatus = 'paid' | 'unpaid' | 'overdue';

/** Row DTOs return `amount` in the row's own `currency` (as entered). */
export interface BillDto {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  /** Gregorian ISO date of the first due. */
  startOn: string;
  /** Gregorian ISO date of the last due. */
  endOn: string;
  dueDay: number;
  /** Null = Others (no company). */
  companyId: string | null;
  companyName: string | null;
  /** Company id when that company has a logo (fetch `/api/companies/:id/logo`). */
  logoKey: string | null;
  createdAt: string;
}

export interface BankDepositDto {
  id: string;
  amount: number;
  currency: Currency;
  /** Gregorian ISO date the transfer arrived. */
  arrivedOn: string;
  /** Gregorian ISO date of Jalali day 1 of the counted month. */
  bookedOn: string;
  note: string | null;
  createdAt: string;
}

export interface ExpenseDto {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  /** Gregorian ISO purchase date. */
  occurredOn: string;
  note: string | null;
  createdAt: string;
}

export interface InstallmentDto {
  id: string;
  billId: string;
  title: string;
  amount: number;
  currency: Currency;
  /** Gregorian ISO due date. */
  dueDate: string;
  paidAt: string | null;
  companyId: string | null;
  companyName: string | null;
  logoKey: string | null;
  status: InstallmentStatus;
}

/** Ledger money fields are in the user's display currency (`LedgerMonthDto.currency`). */
export interface LedgerEntryDto {
  id: string;
  kind: 'deposit' | 'bill' | 'expense';
  title: string;
  detail: string | null;
  amount: number;
  originalAmount: number;
  originalCurrency: Currency;
  /** Gregorian ISO date of the line. */
  date: string;
  status: InstallmentStatus | null;
  installmentId: string | null;
  expenseId: string | null;
  category: ExpenseCategory | null;
  balance: number;
}

export interface LedgerMonthPointDto {
  /** Gregorian ISO date of Jalali day 1 of this chart month. */
  date: string;
  label: string;
  income: number;
  bills: number;
  expenses: number;
  balance: number;
}

export interface LedgerMonthDto {
  /** Gregorian ISO date of Jalali day 1 of the statement month. */
  date: string;
  currency: Currency;
  monthIncome: number;
  monthBills: number;
  monthExpenses: number;
  monthSpending: number;
  monthNet: number;
  openingBalance: number;
  closingBalance: number;
  entries: LedgerEntryDto[];
  depositCount: number;
  billCount: number;
  expenseCount: number;
  paidBillsTotal: number;
  unpaidBillsTotal: number;
  chartSeries: LedgerMonthPointDto[];
}

export interface CurrencySettingsDto {
  currency: Currency;
  /** Effective units per USD for this user (manual IRR applied). */
  rates: FxRates;
  /** Official API units per USD. */
  marketRates: FxRates;
  irrPerUsd: number | null;
  source: string;
  fetchedAt: string | null;
}
