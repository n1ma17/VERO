import { computed, ref, watch } from 'vue'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useExpenses } from '@/composables/useExpenses'
import { useInstallments } from '@/composables/useInstallments'
import type { JalaliMonth } from '@/types/bill'
import type { LedgerEntry, LedgerMonthPoint } from '@/types/ledger'
import { getInstallmentStatus } from '@/utils/installmentStatus'
import { balanceThrough as balanceThroughTotals, buildMonthTotals } from '@/utils/ledger'
import {
  JALALI_MONTH_NAMES,
  currentJalaliMonth,
  formatJalaliMonth,
  indexToMonth,
  monthToIndex,
} from '@/utils/jalali'

const VIEW_KEY = 'money-managment:transactions-view-month'
const CHART_MONTHS = 6

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return JSON.parse(raw) as JalaliMonth
  } catch {
    /* ignore */
  }
  return currentJalaliMonth()
}

const viewMonth = ref<JalaliMonth>(loadViewMonth())

watch(viewMonth, (value) => localStorage.setItem(VIEW_KEY, JSON.stringify(value)), { deep: true })

type PendingEntry = Omit<LedgerEntry, 'balance'> & { sortKey: number }

function dateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day
}

/**
 * Deposits (by their "counted" month) minus bill installments (by due month) and expenses
 * (by purchase month). Balance is cumulative across all months and may go negative.
 */
export function useLedger() {
  const { deposits } = useBankDeposits()
  const { allInstallments } = useInstallments()
  const { expenses } = useExpenses()

  const monthTotals = computed(() =>
    buildMonthTotals(deposits.value, allInstallments.value, expenses.value),
  )

  function balanceThrough(index: number): number {
    return balanceThroughTotals(monthTotals.value, index)
  }

  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))
  const viewLabel = computed(() => formatJalaliMonth(viewMonth.value.year, viewMonth.value.month))
  const isCurrentMonth = computed(() => {
    const now = currentJalaliMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  const monthIncome = computed(() => monthTotals.value.get(viewIndex.value)?.income ?? 0)
  const monthBills = computed(() => monthTotals.value.get(viewIndex.value)?.bills ?? 0)
  const monthExpenses = computed(() => monthTotals.value.get(viewIndex.value)?.expenses ?? 0)
  const monthSpending = computed(() => monthBills.value + monthExpenses.value)
  const monthNet = computed(() => monthIncome.value - monthSpending.value)
  const openingBalance = computed(() => balanceThrough(viewIndex.value - 1))
  const closingBalance = computed(() => openingBalance.value + monthNet.value)

  const entries = computed<LedgerEntry[]>(() => {
    const { year, month } = viewMonth.value
    const pending: PendingEntry[] = []

    for (const deposit of deposits.value) {
      if (deposit.bookedYear !== year || deposit.bookedMonth !== month) continue
      const bankInOtherMonth = deposit.jalaliYear !== year || deposit.jalaliMonth !== month
      pending.push({
        id: `deposit-${deposit.id}`,
        kind: 'deposit',
        title: deposit.note ?? 'Bank deposit',
        detail: bankInOtherMonth
          ? `Arrived ${formatJalaliMonth(deposit.jalaliYear, deposit.jalaliMonth)}`
          : null,
        amount: deposit.amount,
        year: deposit.jalaliYear,
        month: deposit.jalaliMonth,
        day: deposit.jalaliDay,
        status: null,
        installmentId: null,
        expenseId: null,
        category: null,
        sortKey: dateKey(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay) * 3,
      })
    }

    for (const installment of allInstallments.value) {
      if (installment.dueYear !== year || installment.dueMonth !== month) continue
      pending.push({
        id: `bill-${installment.id}`,
        kind: 'bill',
        title: installment.title,
        detail: null,
        amount: installment.amount,
        year: installment.dueYear,
        month: installment.dueMonth,
        day: installment.dueDay,
        status: getInstallmentStatus(installment),
        installmentId: installment.id,
        expenseId: null,
        category: null,
        sortKey: dateKey(installment.dueYear, installment.dueMonth, installment.dueDay) * 3 + 1,
      })
    }

    for (const expense of expenses.value) {
      if (expense.jalaliYear !== year || expense.jalaliMonth !== month) continue
      pending.push({
        id: `expense-${expense.id}`,
        kind: 'expense',
        title: expense.title,
        detail: expense.note,
        amount: expense.amount,
        year: expense.jalaliYear,
        month: expense.jalaliMonth,
        day: expense.jalaliDay,
        status: null,
        installmentId: null,
        expenseId: expense.id,
        category: expense.category,
        sortKey: dateKey(expense.jalaliYear, expense.jalaliMonth, expense.jalaliDay) * 3 + 2,
      })
    }

    pending.sort((a, b) => a.sortKey - b.sortKey)

    let running = openingBalance.value
    return pending.map(({ sortKey: _sortKey, ...entry }) => {
      running += entry.kind === 'deposit' ? entry.amount : -entry.amount
      return { ...entry, balance: running }
    })
  })

  const depositCount = computed(() => entries.value.filter((e) => e.kind === 'deposit').length)
  const billCount = computed(() => entries.value.filter((e) => e.kind === 'bill').length)
  const expenseCount = computed(() => entries.value.filter((e) => e.kind === 'expense').length)
  const paidBillsTotal = computed(() =>
    entries.value
      .filter((e) => e.kind === 'bill' && e.status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0),
  )
  const unpaidBillsTotal = computed(() => monthBills.value - paidBillsTotal.value)

  const chartSeries = computed<LedgerMonthPoint[]>(() => {
    const points: LedgerMonthPoint[] = []
    for (let offset = CHART_MONTHS - 1; offset >= 0; offset--) {
      const index = viewIndex.value - offset
      const { year, month } = indexToMonth(index)
      const totals = monthTotals.value.get(index)
      points.push({
        year,
        month,
        label: JALALI_MONTH_NAMES[month - 1].slice(0, 3),
        income: totals?.income ?? 0,
        bills: totals?.bills ?? 0,
        expenses: totals?.expenses ?? 0,
        balance: balanceThrough(index),
      })
    }
    return points
  })

  function setViewMonth(year: number, month: number) {
    viewMonth.value = { year, month }
  }

  function shiftViewMonth(delta: number) {
    const next = indexToMonth(viewIndex.value + delta)
    setViewMonth(next.year, next.month)
  }

  function goToCurrentMonth() {
    const now = currentJalaliMonth()
    setViewMonth(now.year, now.month)
  }

  return {
    viewMonth,
    viewLabel,
    isCurrentMonth,
    monthIncome,
    monthBills,
    monthExpenses,
    monthSpending,
    monthNet,
    openingBalance,
    closingBalance,
    entries,
    depositCount,
    billCount,
    expenseCount,
    paidBillsTotal,
    unpaidBillsTotal,
    chartSeries,
    setViewMonth,
    shiftViewMonth,
    goToCurrentMonth,
  }
}
