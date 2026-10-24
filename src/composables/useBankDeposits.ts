import { computed, readonly, ref, watch } from 'vue'
import type { JalaliMonth } from '@/types/bill'
import type { BankDeposit, NewBankDeposit } from '@/types/bankDeposit'
import { clampDueDay, currentJalaliMonth, monthToIndex } from '@/utils/jalali'

const STORAGE_KEY = 'money-managment:bank-deposits'
const VIEW_KEY = 'money-managment:deposits-view-month'

function load(): BankDeposit[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as BankDeposit[]
    return raw.map((deposit) => ({
      ...deposit,
      jalaliDay: deposit.jalaliDay ?? 1,
      bookedYear: deposit.bookedYear ?? deposit.jalaliYear,
      bookedMonth: deposit.bookedMonth ?? deposit.jalaliMonth,
    }))
  } catch {
    return []
  }
}

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

const deposits = ref<BankDeposit[]>(load())
const editingDepositId = ref<string | null>(null)
const viewMonth = ref<JalaliMonth>(loadViewMonth())

watch(
  deposits,
  (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  { deep: true },
)

watch(viewMonth, (value) => localStorage.setItem(VIEW_KEY, JSON.stringify(value)), { deep: true })

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
  }

  function addDeposit(input: NewBankDeposit) {
    const jalaliDay = clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth)
    deposits.value.unshift({
      id: crypto.randomUUID(),
      amount: Math.round(input.amount),
      jalaliYear: input.jalaliYear,
      jalaliMonth: input.jalaliMonth,
      jalaliDay,
      bookedYear: input.bookedYear,
      bookedMonth: input.bookedMonth,
      note: input.note?.trim() || null,
      createdAt: new Date().toISOString(),
    })
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

  function updateDeposit(id: string, input: NewBankDeposit) {
    const index = deposits.value.findIndex((deposit) => deposit.id === id)
    if (index === -1) return false

    const jalaliDay = clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth)
    deposits.value[index] = {
      ...deposits.value[index],
      amount: Math.round(input.amount),
      jalaliYear: input.jalaliYear,
      jalaliMonth: input.jalaliMonth,
      jalaliDay,
      bookedYear: input.bookedYear,
      bookedMonth: input.bookedMonth,
      note: input.note?.trim() || null,
    }
    editingDepositId.value = null
    return true
  }

  function removeDeposit(id: string) {
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
