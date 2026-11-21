import { computed, readonly, ref } from 'vue'
import { api } from '@/api/http'
import { bumpMoneyData } from '@/composables/moneyGeneration'
import { roundMoney, withDisplayAmount } from '@/composables/useCurrency'
import type { JalaliMonth } from '@/types/bill'
import type { BankDeposit, NewBankDeposit } from '@/types/bankDeposit'
import { clampDueDay, currentJalaliMonth, monthToIndex } from '@/utils/jalali'
import { depositFromApi, depositToApi, type DepositApi } from '@/utils/moneyApi'

const VIEW_KEY = 'money-managment:deposits-view-month'
/** Soft cap for month picker; furthest booked month can extend past this. */
const MAX_FUTURE_MONTHS = 60

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return JSON.parse(raw) as JalaliMonth
  } catch {
    /* ignore */
  }
  return currentJalaliMonth()
}

function depositSortKey(deposit: BankDeposit): number {
  return deposit.jalaliYear * 10000 + deposit.jalaliMonth * 100 + deposit.jalaliDay
}

function isBookedInMonth(deposit: BankDeposit, year: number, month: number): boolean {
  return deposit.bookedYear === year && deposit.bookedMonth === month
}

function payload(input: NewBankDeposit) {
  return depositToApi({
    amount: roundMoney(input.amount, input.currency),
    currency: input.currency,
    jalaliYear: input.jalaliYear,
    jalaliMonth: input.jalaliMonth,
    jalaliDay: clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth),
    bookedYear: input.bookedYear,
    bookedMonth: input.bookedMonth,
    note: input.note?.trim() || null,
  })
}

const deposits = ref<BankDeposit[]>([])
const displayDeposits = computed(() => deposits.value.map(withDisplayAmount))
const editingDepositId = ref<string | null>(null)
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export async function loadDeposits(): Promise<void> {
  const rows = await api<DepositApi[]>('/api/deposits')
  deposits.value = rows.map(depositFromApi)
}

export function clearDeposits(): void {
  deposits.value = []
}

export function getDepositsSnapshot(): BankDeposit[] {
  return deposits.value
}

export function useBankDeposits() {
  const calendarMonth = computed(() => currentJalaliMonth())

  const depositsInViewMonth = computed(() => {
    const { year, month } = viewMonth.value
    return displayDeposits.value
      .filter((deposit) => isBookedInMonth(deposit, year, month))
      .sort((a, b) => depositSortKey(b) - depositSortKey(a))
  })

  const totalBalance = computed(() =>
    displayDeposits.value.reduce((sum, deposit) => sum + deposit.amount, 0),
  )

  const monthTotal = computed(() =>
    depositsInViewMonth.value.reduce((sum, deposit) => sum + deposit.amount, 0),
  )

  const currentMonthTotal = computed(() => {
    const { year, month } = calendarMonth.value
    return displayDeposits.value
      .filter((deposit) => isBookedInMonth(deposit, year, month))
      .reduce((sum, deposit) => sum + deposit.amount, 0)
  })

  const isCurrentMonth = computed(() => {
    const now = calendarMonth.value
    return viewMonth.value.year === now.year && viewMonth.value.month === now.month
  })

  const maxViewMonthIndex = computed(() => {
    const now = calendarMonth.value
    let max = monthToIndex(now.year, now.month) + MAX_FUTURE_MONTHS
    for (const deposit of deposits.value) {
      max = Math.max(max, monthToIndex(deposit.bookedYear, deposit.bookedMonth))
    }
    return max
  })

  const canViewNextMonth = computed(
    () =>
      monthToIndex(viewMonth.value.year, viewMonth.value.month) < maxViewMonthIndex.value,
  )

  function setViewMonth(year: number, month: number) {
    viewMonth.value = { year, month }
    localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
  }

  function goToCurrentMonth() {
    const now = calendarMonth.value
    setViewMonth(now.year, now.month)
  }

  async function addDeposit(input: NewBankDeposit) {
    const created = depositFromApi(
      await api<DepositApi>('/api/deposits', {
        method: 'POST',
        body: JSON.stringify(payload(input)),
      }),
    )
    deposits.value = [created, ...deposits.value]
    if (
      created.bookedYear !== viewMonth.value.year ||
      created.bookedMonth !== viewMonth.value.month
    ) {
      setViewMonth(created.bookedYear, created.bookedMonth)
    }
    bumpMoneyData()
  }

  const editingDeposit = computed(() => {
    if (!editingDepositId.value) return null
    return displayDeposits.value.find((deposit) => deposit.id === editingDepositId.value) ?? null
  })

  function startEditingDeposit(id: string) {
    const exists = deposits.value.some((deposit) => deposit.id === id)
    editingDepositId.value = exists ? id : null
  }

  function cancelEditingDeposit() {
    editingDepositId.value = null
  }

  async function updateDeposit(id: string, input: NewBankDeposit) {
    const updated = depositFromApi(
      await api<DepositApi>(`/api/deposits/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload(input)),
      }),
    )
    deposits.value = deposits.value.map((deposit) => (deposit.id === id ? updated : deposit))
    editingDepositId.value = null
    bumpMoneyData()
    return true
  }

  async function removeDeposit(id: string) {
    await api(`/api/deposits/${id}`, { method: 'DELETE' })
    deposits.value = deposits.value.filter((deposit) => deposit.id !== id)
    if (editingDepositId.value === id) editingDepositId.value = null
    bumpMoneyData()
  }

  return {
    deposits: displayDeposits,
    depositsInViewMonth,
    viewMonth,
    calendarMonth,
    totalBalance,
    monthTotal,
    currentMonthTotal,
    isCurrentMonth,
    canViewNextMonth,
    setViewMonth,
    goToCurrentMonth,
    editingDepositId: readonly(editingDepositId),
    editingDeposit,
    addDeposit,
    updateDeposit,
    startEditingDeposit,
    cancelEditingDeposit,
    removeDeposit,
  }
}