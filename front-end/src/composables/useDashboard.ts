import { computed } from 'vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useExpenses } from '@/composables/useExpenses'
import { useInstallments } from '@/composables/useInstallments'
import type { ExpenseCategory } from '@/types/expense'
import type { InstallmentStatus } from '@/types/installment'
import { daysBetween, toIsoDate } from '@/utils/date'
import { getInstallmentStatus } from '@/utils/installmentStatus'
import {
  JALALI_MONTH_NAMES,
  currentJalaliDate,
  formatJalaliDate,
  indexToMonth,
  jalaliMonthLength,
  monthToIndex,
} from '@/utils/jalali'
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
  key: 'bills' | ExpenseCategory
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
  logoKey: string | null
}

function dateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}

/** Read-only overview of the current Jalali month, built from deposits, bill installments and expenses. */
export function useDashboard() {
  const { deposits } = useBankDeposits()
  const { allInstallments } = useInstallments()
  const { expenses } = useExpenses()

  const today = currentJalaliDate()
  const todayIso = toIsoDate(new Date())
  const currentIndex = monthToIndex(today.year, today.month)

  const totals = computed(() =>
    buildMonthTotals(deposits.value, allInstallments.value, expenses.value),
  )

  const monthIncome = computed(() => totals.value.get(currentIndex)?.income ?? 0)
  const monthBills = computed(() => totals.value.get(currentIndex)?.bills ?? 0)
  const monthExpenses = computed(() => totals.value.get(currentIndex)?.expenses ?? 0)
  const monthSpending = computed(() => monthBills.value + monthExpenses.value)
  const monthNet = computed(() => monthIncome.value - monthSpending.value)
  const balance = computed(() => balanceThrough(totals.value, currentIndex))
  const savingsRate = computed(() =>
    monthIncome.value > 0 ? Math.round((monthNet.value / monthIncome.value) * 100) : null,
  )

  const monthDepositCount = computed(
    () =>
      deposits.value.filter(
        (deposit) => deposit.bookedYear === today.year && deposit.bookedMonth === today.month,
      ).length,
  )

  const monthExpenseList = computed(() =>
    expenses.value.filter(
      (expense) => expense.jalaliYear === today.year && expense.jalaliMonth === today.month,
    ),
  )
  const monthExpenseCount = computed(() => monthExpenseList.value.length)

  const monthInstallments = computed(() =>
    allInstallments.value.filter(
      (installment) => installment.dueYear === today.year && installment.dueMonth === today.month,
    ),
  )
  const monthBillCount = computed(() => monthInstallments.value.length)
  const monthPaidCount = computed(() => monthInstallments.value.filter((i) => i.paidAt).length)
  const monthPaidAmount = computed(() =>
    monthInstallments.value.filter((i) => i.paidAt).reduce((sum, i) => sum + i.amount, 0),
  )

  const overdue = computed(() =>
    allInstallments.value.filter(
      (installment) => getInstallmentStatus(installment, todayIso) === 'overdue',
    ),
  )
  const overdueCount = computed(() => overdue.value.length)
  const overdueAmount = computed(() => overdue.value.reduce((sum, i) => sum + i.amount, 0))

  const upcomingBills = computed<UpcomingBill[]>(() =>
    allInstallments.value
      .filter((installment) => !installment.paidAt)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, UPCOMING_LIMIT)
      .map((installment) => ({
        id: installment.id,
        title: installment.title,
        amount: installment.amount,
        dueLabel: formatJalaliDate(installment.dueYear, installment.dueMonth, installment.dueDay),
        daysLeft: daysBetween(todayIso, installment.dueDate),
        status: getInstallmentStatus(installment, todayIso),
        logoKey: installment.logoKey,
      })),
  )

  function monthSeries(count: number): MonthFlowPoint[] {
    const points: MonthFlowPoint[] = []
    for (let offset = count - 1; offset >= 0; offset--) {
      const index = currentIndex - offset
      const { year, month } = indexToMonth(index)
      const monthTotals = totals.value.get(index)
      points.push({
        year,
        month,
        label: JALALI_MONTH_NAMES[month - 1].slice(0, 3),
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
    const items: (ActivityItem & { sortKey: number; createdAt: string })[] = [
      ...deposits.value.map((deposit) => ({
        id: `deposit-${deposit.id}`,
        kind: 'deposit' as const,
        title: deposit.note ?? 'Bank deposit',
        dateLabel: formatJalaliDate(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay),
        amount: deposit.amount,
        category: null,
        expenseId: null,
        sortKey: dateKey(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay),
        createdAt: deposit.createdAt,
      })),
      ...expenses.value.map((expense) => ({
        id: `expense-${expense.id}`,
        kind: 'expense' as const,
        title: expense.title,
        dateLabel: formatJalaliDate(expense.jalaliYear, expense.jalaliMonth, expense.jalaliDay),
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

  const monthLength = jalaliMonthLength(today.year, today.month)

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
