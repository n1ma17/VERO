import { computed, readonly, ref } from 'vue'
import { api } from '@/api/http'
import type { JalaliMonth } from '@/types/bill'
import type { BankDeposit, NewBankDeposit } from '@/types/bankDeposit'
import { clampDueDay, currentJalaliMonth, monthToIndex } from '@/utils/jalali'

const VIEW_KEY = 'money-managment:deposits-view-month'

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as JalaliMonth
      const now = currentJalaliMonth()
      if (monthToIndex(parsed.year, parsed.month) <= monthToIndex(now.year, now.month)) {
        return parsed
      }
    }
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
  return {
    amount: Math.round(input.amount),
    jalaliYear: input.jalaliYear,
    jalaliMonth: input.jalaliMonth,
    jalaliDay: clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth),
    bookedYear: input.bookedYear,
    bookedMonth: input.bookedMonth,
    note: input.note?.trim() || null,
  }
}

const deposits = ref<BankDeposit[]>([])
const editingDepositId = ref<string | null>(null)
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export function replaceDeposits(next: BankDeposit[]): void {
  deposits.value = next
}

export function getDepositsSnapshot(): BankDeposit[] {
  return deposits.value
}

export function useBankDeposits() {
  const calendarMonth = computed(() => currentJalaliMonth())

  const depositsInViewMonth = computed(() => {
    const { year, month } = viewMonth.value
    return deposits.value
      .filter((deposit) => isBookedInMonth(deposit, year, month))
      .sort((a, b) => depositSortKey(b) - depositSortKey(a))
  })

  const totalBalance = computed(() =>
    deposits.value.reduce((sum, deposit) => sum + deposit.amount, 0),
  )

  const monthTotal = computed(() =>
    depositsInViewMonth.value.reduce((sum, deposit) => sum + deposit.amount, 0),
  )

  const currentMonthTotal = computed(() => {
    const { year, month } = calendarMonth.value
    return deposits.value
      .filter((deposit) => isBookedInMonth(deposit, year, month))
      .reduce((sum, deposit) => sum + deposit.amount, 0)
  })

  const canViewNextMonth = computed(() => {
    const now = calendarMonth.value
    return (
      monthToIndex(viewMonth.value.year, viewMonth.value.month) <
      monthToIndex(now.year, now.month)
    )
  })

  function setViewMonth(year: number, month: number) {
    viewMonth.value = { year, month }
    localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
  }

  async function addDeposit(input: NewBankDeposit) {
    const created = await api<BankDeposit>('/api/deposits', {
      method: 'POST',
      body: JSON.stringify(payload(input)),
    })
    deposits.value = [created, ...deposits.value]
  }

  const editingDeposit = computed(() => {
    if (!editingDepositId.value) return null
    return deposits.value.find((deposit) => deposit.id === editingDepositId.value) ?? null
  })

  function startEditingDeposit(id: string) {
    const exists = deposits.value.some((deposit) => deposit.id === id)
    editingDepositId.value = exists ? id : null
  }

  function cancelEditingDeposit() {
    editingDepositId.value = null
  }

  async function updateDeposit(id: string, input: NewBankDeposit) {
    const updated = await api<BankDeposit>(`/api/deposits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload(input)),
    })
    deposits.value = deposits.value.map((deposit) => (deposit.id === id ? updated : deposit))
    editingDepositId.value = null
    return true
  }

  async function removeDeposit(id: string) {
    await api(`/api/deposits/${id}`, { method: 'DELETE' })
    deposits.value = deposits.value.filter((deposit) => deposit.id !== id)
    if (editingDepositId.value === id) editingDepositId.value = null
  }

  return {
    deposits: readonly(deposits),
    depositsInViewMonth,
    viewMonth,
    calendarMonth,
    totalBalance,
    monthTotal,
    currentMonthTotal,
    canViewNextMonth,
    setViewMonth,
    editingDepositId: readonly(editingDepositId),
    editingDeposit,
    addDeposit,
    updateDeposit,
    startEditingDeposit,
    cancelEditingDeposit,
    removeDeposit,
  }
}
