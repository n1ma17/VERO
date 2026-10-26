import { computed, ref, watch } from 'vue'
import { ApiError, api } from '@/api/http'
import { useBankDeposits } from '@/composables/useBankDeposits'
import { useExpenses } from '@/composables/useExpenses'
import { useInstallments } from '@/composables/useInstallments'
import type { JalaliMonth } from '@/types/bill'
import type { LedgerMonth, LedgerMonthPoint } from '@/types/ledger'
import {
  JALALI_MONTH_NAMES,
  currentJalaliMonth,
  formatJalaliMonth,
  indexToMonth,
  jalaliMonthFirstIso,
  monthToIndex,
} from '@/utils/jalali'
import { ledgerFromApi, type LedgerMonthApi } from '@/utils/moneyApi'

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

function emptyChart(year: number, month: number): LedgerMonthPoint[] {
  const viewIndex = monthToIndex(year, month)
  const points: LedgerMonthPoint[] = []
  for (let offset = CHART_MONTHS - 1; offset >= 0; offset--) {
    const point = indexToMonth(viewIndex - offset)
    points.push({
      year: point.year,
      month: point.month,
      label: JALALI_MONTH_NAMES[point.month - 1].slice(0, 3),
      income: 0,
      bills: 0,
      expenses: 0,
      balance: 0,
    })
  }
  return points
}

function emptyMonth(year: number, month: number): LedgerMonth {
  return {
    year,
    month,
    monthIncome: 0,
    monthBills: 0,
    monthExpenses: 0,
    monthSpending: 0,
    monthNet: 0,
    openingBalance: 0,
    closingBalance: 0,
    entries: [],
    depositCount: 0,
    billCount: 0,
    expenseCount: 0,
    paidBillsTotal: 0,
    unpaidBillsTotal: 0,
    chartSeries: emptyChart(year, month),
  }
}

const viewMonth = ref<JalaliMonth>(loadViewMonth())
const snapshot = ref<LedgerMonth | null>(null)
const sessionActive = ref(false)

watch(viewMonth, (value) => localStorage.setItem(VIEW_KEY, JSON.stringify(value)), { deep: true })

let fetchSeq = 0
let watching = false

export async function loadLedger(): Promise<void> {
  if (!sessionActive.value) return
  const { year, month } = viewMonth.value
  const seq = ++fetchSeq
  try {
    const data = await api<LedgerMonthApi>(
      `/api/ledger?date=${jalaliMonthFirstIso(year, month)}`,
    )
    if (seq !== fetchSeq) return
    snapshot.value = ledgerFromApi(data)
  } catch (error) {
    if (seq !== fetchSeq) return
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      snapshot.value = null
      return
    }
    snapshot.value = emptyMonth(year, month)
  }
}

export function armLedger(): void {
  sessionActive.value = true
}

export function clearLedger(): void {
  sessionActive.value = false
  fetchSeq += 1
  snapshot.value = null
}

function ensureLedgerWatch(): void {
  if (watching) return
  watching = true
  const { deposits } = useBankDeposits()
  const { expenses } = useExpenses()
  const { allInstallments } = useInstallments()
  watch(
    [viewMonth, deposits, expenses, allInstallments],
    () => {
      void loadLedger()
    },
    { immediate: true },
  )
}

/**
 * Statement for the selected Jalali month, loaded from Postgres via
 * `GET /api/ledger?date=` (Gregorian ISO of that month's first day).
 * View-month is only UI state (localStorage).
 */
export function useLedger() {
  ensureLedgerWatch()

  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))
  const viewLabel = computed(() => formatJalaliMonth(viewMonth.value.year, viewMonth.value.month))
  const isCurrentMonth = computed(() => {
    const now = currentJalaliMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  const month = computed(() => {
    const current = snapshot.value
    if (
      current &&
      current.year === viewMonth.value.year &&
      current.month === viewMonth.value.month
    ) {
      return current
    }
    return emptyMonth(viewMonth.value.year, viewMonth.value.month)
  })

  const loading = computed(() => {
    const current = snapshot.value
    return (
      current === null ||
      current.year !== viewMonth.value.year ||
      current.month !== viewMonth.value.month
    )
  })

  const monthIncome = computed(() => month.value.monthIncome)
  const monthBills = computed(() => month.value.monthBills)
  const monthExpenses = computed(() => month.value.monthExpenses)
  const monthSpending = computed(() => month.value.monthSpending)
  const monthNet = computed(() => month.value.monthNet)
  const openingBalance = computed(() => month.value.openingBalance)
  const closingBalance = computed(() => month.value.closingBalance)
  const entries = computed(() => month.value.entries)
  const depositCount = computed(() => month.value.depositCount)
  const billCount = computed(() => month.value.billCount)
  const expenseCount = computed(() => month.value.expenseCount)
  const paidBillsTotal = computed(() => month.value.paidBillsTotal)
  const unpaidBillsTotal = computed(() => month.value.unpaidBillsTotal)
  const chartSeries = computed(() => month.value.chartSeries)

  function setViewMonth(year: number, monthNumber: number) {
    viewMonth.value = { year, month: monthNumber }
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
    loading,
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
