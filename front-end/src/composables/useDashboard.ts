import { computed } from 'vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { moneyGeneration } from '@/composables/moneyGeneration'
import { useCurrency } from '@/composables/useCurrency'
import { useExpenses } from '@/composables/useExpenses'
import { useInstallments } from '@/composables/useInstallments'
import type { ExpenseCategory } from '@/types/expense'
import type { InstallmentStatus } from '@/types/installment'
import { daysBetween, toIsoDate } from '@/utils/date'
import { getInstallmentStatus } from '@/utils/installmentStatus'
import {
  calendarMonthLength,
  calendarMonthNames,
  currentCalendarDate,
  formatCalendarDate,
  indexToMonth,
  monthToIndex,
} from '@/utils/calendar'
import { balanceThrough, buildMonthTotals } from '@/utils/ledger'

const CASH_FLOW_MONTHS = 12
const BALANCE_TREND_MONTHS = 6
const UPCOMING_LIMIT = 5
const RECENT_ACTIVITY_LIMIT = 6

export interface MonthFlowPoint {
  year: number
  month: number
  label: string
  income: number
  bills: number
  expenses: number
  balance: number
}

/** One slice of "where money goes": all bills together, or one expense category. */
export interface SpendingSlice {
  key: 'bills' | string
  amount: number
  share: number
}

export interface ActivityItem {
  id: string
  kind: 'deposit' | 'expense'
  title: string
  dateLabel: string
  amount: number
  category: ExpenseCategory | null
  expenseId: string | null
}

export interface UpcomingBill {
  id: string
  title: string
  amount: number
  dueLabel: string
  daysLeft: number
  status: InstallmentStatus
  companyName: string | null
  logoKey: string | null
}

function dateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}

/** Read-only overview of the current calendar month, built from deposits, bill installments and expenses. */
export function useDashboard() {
  const { deposits } = useBankDeposits()
  const { allInstallments } = useInstallments()
  const { expenses } = useExpenses()
  const { currency } = useCurrency()

  const today = computed(() => {
    void currency.value
    return currentCalendarDate()
  })
  const todayIso = toIsoDate(new Date())
  const currentIndex = computed(() => monthToIndex(today.value.year, today.value.month))

  const moneyInputs = computed(() => {
    void moneyGeneration.value
    return {
      deposits: deposits.value,
      installments: allInstallments.value,
      expenses: expenses.value,
    }
  })

  const totals = computed(() =>
    buildMonthTotals(
      moneyInputs.value.deposits,
      moneyInputs.value.installments,
      moneyInputs.value.expenses,
    ),
  )

  const monthIncome = computed(() => totals.value.get(currentIndex.value)?.income ?? 0)
  const monthBills = computed(() => totals.value.get(currentIndex.value)?.bills ?? 0)
  const monthExpenses = computed(() => totals.value.get(currentIndex.value)?.expenses ?? 0)
  const monthSpending = computed(() => monthBills.value + monthExpenses.value)
  const monthNet = computed(() => monthIncome.value - monthSpending.value)
  const balance = computed(() => balanceThrough(totals.value, currentIndex.value))
  const savingsRate = computed(() =>
    monthIncome.value > 0 ? Math.round((monthNet.value / monthIncome.value) * 100) : null,
  )

  const monthDepositCount = computed(
    () =>
      moneyInputs.value.deposits.filter(
        (deposit) =>
          deposit.bookedYear === today.value.year && deposit.bookedMonth === today.value.month,
      ).length,
  )

  const monthExpenseList = computed(() =>
    moneyInputs.value.expenses.filter(
      (expense) =>
        expense.jalaliYear === today.value.year && expense.jalaliMonth === today.value.month,
    ),
  )
  const monthExpenseCount = computed(() => monthExpenseList.value.length)

  const monthInstallments = computed(() =>
    moneyInputs.value.installments.filter(
      (installment) =>
        installment.dueYear === today.value.year && installment.dueMonth === today.value.month,
    ),
  )
  const monthBillCount = computed(() => monthInstallments.value.length)
  const monthPaidCount = computed(() => monthInstallments.value.filter((i) => i.paidAt).length)
  const monthPaidAmount = computed(() =>
    monthInstallments.value.filter((i) => i.paidAt).reduce((sum, i) => sum + i.amount, 0),
  )

  const overdue = computed(() =>
    moneyInputs.value.installments.filter(
      (installment) => getInstallmentStatus(installment, todayIso) === 'overdue',
    ),
  )
  const overdueCount = computed(() => overdue.value.length)
  const overdueAmount = computed(() => overdue.value.reduce((sum, i) => sum + i.amount, 0))

  const upcomingBills = computed<UpcomingBill[]>(() =>
    moneyInputs.value.installments
      .filter((installment) => !installment.paidAt)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, UPCOMING_LIMIT)
      .map((installment) => ({
        id: installment.id,
        title: installment.title,
        amount: installment.amount,
        dueLabel: formatCalendarDate(
          installment.dueYear,
          installment.dueMonth,
          installment.dueDay,
        ),
        daysLeft: daysBetween(todayIso, installment.dueDate),
        status: getInstallmentStatus(installment, todayIso),
        companyName: installment.companyName,
        logoKey: installment.logoKey,
      })),
  )

  function monthSeries(count: number): MonthFlowPoint[] {
    const names = calendarMonthNames()
    const points: MonthFlowPoint[] = []
    for (let offset = count - 1; offset >= 0; offset--) {
      const index = currentIndex.value - offset
      const { year, month } = indexToMonth(index)
      const monthTotals = totals.value.get(index)
      points.push({
        year,
        month,
        label: names[month - 1].slice(0, 3),
        income: monthTotals?.income ?? 0,
        bills: monthTotals?.bills ?? 0,
        expenses: monthTotals?.expenses ?? 0,
        balance: balanceThrough(totals.value, index),
      })
    }
    return points
  }

  const cashFlow = computed(() => monthSeries(CASH_FLOW_MONTHS))
  const balanceTrend = computed(() => monthSeries(BALANCE_TREND_MONTHS))

  const spendingBreakdown = computed<SpendingSlice[]>(() => {
    const total = monthSpending.value
    if (total === 0) return []
    const byCategory = new Map<ExpenseCategory, number>()
    for (const expense of monthExpenseList.value) {
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount)
    }
    const slices: SpendingSlice[] = [...byCategory.entries()].map(([key, amount]) => ({
      key,
      amount,
      share: amount / total,
    }))
    if (monthBills.value > 0) {
      slices.push({ key: 'bills', amount: monthBills.value, share: monthBills.value / total })
    }
    return slices.sort((a, b) => b.amount - a.amount)
  })

  const recentActivity = computed<ActivityItem[]>(() => {
    const { deposits: depositRows, expenses: expenseRows } = moneyInputs.value
    const items: (ActivityItem & { sortKey: number; createdAt: string })[] = [
      ...depositRows.map((deposit) => ({
        id: `deposit-${deposit.id}`,
        kind: 'deposit' as const,
        title: deposit.note ?? 'Bank deposit',
        dateLabel: formatCalendarDate(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay),
        amount: deposit.amount,
        category: null,
        expenseId: null,
        sortKey: dateKey(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay),
        createdAt: deposit.createdAt,
      })),
      ...expenseRows.map((expense) => ({
        id: `expense-${expense.id}`,
        kind: 'expense' as const,
        title: expense.title,
        dateLabel: formatCalendarDate(expense.jalaliYear, expense.jalaliMonth, expense.jalaliDay),
        amount: expense.amount,
        category: expense.category,
        expenseId: expense.id,
        sortKey: dateKey(expense.jalaliYear, expense.jalaliMonth, expense.jalaliDay),
        createdAt: expense.createdAt,
      })),
    ]
    return items
      .sort((a, b) => b.sortKey - a.sortKey || b.createdAt.localeCompare(a.createdAt))
      .slice(0, RECENT_ACTIVITY_LIMIT)
      .map(({ sortKey: _sortKey, createdAt: _createdAt, ...item }) => item)
  })

  const monthLength = computed(() =>
    calendarMonthLength(today.value.year, today.value.month),
  )

  return {
    today,
    monthLength,
    monthIncome,
    monthBills,
    monthExpenses,
    monthSpending,
    monthNet,
    balance,
    savingsRate,
    monthDepositCount,
    monthBillCount,
    monthExpenseCount,
    monthPaidCount,
    monthPaidAmount,
    overdueCount,
    overdueAmount,
    upcomingBills,
    cashFlow,
    balanceTrend,
    spendingBreakdown,
    recentActivity,
  }
}
