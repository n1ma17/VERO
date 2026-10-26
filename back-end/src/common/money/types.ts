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
  startYear: number;
  startMonth: number;
  dueDay: number;
  durationMonths: number;
  logoKey: string | null;
  createdAt: string;
}

export interface BankDepositDto {
  id: string;
  amount: number;
  jalaliYear: number;
  jalaliMonth: number;
  jalaliDay: number;
  bookedYear: number;
  bookedMonth: number;
  note: string | null;
  createdAt: string;
}

export interface ExpenseDto {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  jalaliYear: number;
  jalaliMonth: number;
  jalaliDay: number;
  note: string | null;
  createdAt: string;
}

export interface InstallmentDto {
  id: string;
  billId: string;
  title: string;
  amount: number;
  dueYear: number;
  dueMonth: number;
  dueDay: number;
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
  year: number;
  month: number;
  day: number;
  status: string | null;
  installmentId: string | null;
  expenseId: string | null;
  category: ExpenseCategory | null;
  balance: number;
}

export interface WalletSnapshot {
  bills: BillDto[];
  deposits: BankDepositDto[];
  expenses: ExpenseDto[];
  installments: InstallmentDto[];
}
