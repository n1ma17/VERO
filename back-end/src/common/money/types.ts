export const EXPENSE_CATEGORIES = [
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

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type InstallmentStatus = 'paid' | 'unpaid' | 'overdue';

export interface BillDto {
  id: string;
  title: string;
  amount: number;
  /** Gregorian ISO date of the first due. */
  startOn: string;
  /** Gregorian ISO date of the last due. */
  endOn: string;
  dueDay: number;
  logoKey: string | null;
  createdAt: string;
}

export interface BankDepositDto {
  id: string;
  amount: number;
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
  /** Gregorian ISO due date. */
  dueDate: string;
  paidAt: string | null;
  logoKey: string | null;
  status: InstallmentStatus;
}

export interface LedgerEntryDto {
  id: string;
  kind: 'deposit' | 'bill' | 'expense';
  title: string;
  detail: string | null;
  amount: number;
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

