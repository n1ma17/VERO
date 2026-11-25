import { computed, ref } from 'vue'
import { api } from '@/api/http'
import { bumpMoneyData } from '@/composables/moneyGeneration'
import { withDisplayAmount } from '@/composables/useCurrency'
import { refreshInstallments } from '@/composables/useInstallments'
import type { Bill, JalaliMonth, NewBill } from '@/types/bill'
import { billFromApi, billToApi, type BillApi } from '@/utils/moneyApi'
import { sanitizeViewMonth } from '@/composables/viewMonthSync'
import {
  currentCalendarMonth,
  indexToMonth,
  isBeforeCurrentCalendarMonth,
  isBillActiveInMonth,
  monthToIndex,
} from '@/utils/calendar'

const VIEW_KEY = 'money-managment:bills-view-month'

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return sanitizeViewMonth(JSON.parse(raw) as JalaliMonth)
  } catch {
    /* ignore */
  }
  return currentCalendarMonth()
}

const bills = ref<Bill[]>([])
const displayBills = computed(() => bills.value.map(withDisplayAmount))
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export async function loadBills(): Promise<void> {
  const rows = await api<BillApi[]>('/api/bills')
  bills.value = rows.map(billFromApi)
}

export function clearBills(): void {
  bills.value = []
}

export function resetBillsViewMonth(): void {
  const now = currentCalendarMonth()
  viewMonth.value = now
  localStorage.setItem(VIEW_KEY, JSON.stringify(now))
}

export function alignBillsViewMonth(): void {
  viewMonth.value = loadViewMonth()
  localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
}

export function getBillsSnapshot(): Bill[] {
  return bills.value
}

export function useBills() {
  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))

  const isCurrentMonth = computed(() => {
    const now = currentCalendarMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  const isPastViewMonth = computed(() =>
    isBeforeCurrentCalendarMonth(viewMonth.value.year, viewMonth.value.month),
  )

  function getBillById(id: string): Bill | undefined {
    return displayBills.value.find((bill) => bill.id === id)
  }

  function setViewMonth(year: number, month: number) {
    viewMonth.value = { year, month }
    localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
  }

  function shiftViewMonth(delta: number) {
    const next = indexToMonth(viewIndex.value + delta)
    setViewMonth(next.year, next.month)
  }

  function goToCurrentMonth() {
    const now = currentCalendarMonth()
    setViewMonth(now.year, now.month)
  }

  async function addBill(input: NewBill & { durationMonths: number }): Promise<Bill> {
    const payload = billToApi(input)
    const row = await api<BillApi>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const bill = billFromApi(row)
    bills.value = [bill, ...bills.value]
    await refreshInstallments()
    bumpMoneyData()
    return withDisplayAmount(bill)
  }

  async function updateBill(
    id: string,
    input: NewBill & { durationMonths: number },
  ): Promise<Bill | null> {
    const payload = billToApi(input)
    const row = await api<BillApi>(`/api/bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const bill = billFromApi(row)
    bills.value = bills.value.map((item) => (item.id === id ? bill : item))
    await refreshInstallments()
    bumpMoneyData()
    return withDisplayAmount(bill)
  }

  async function removeBill(id: string): Promise<void> {
    await api(`/api/bills/${id}`, { method: 'DELETE' })
    bills.value = bills.value.filter((item) => item.id !== id)
    await refreshInstallments()
    bumpMoneyData()
  }

  const billsInViewMonth = computed(() => {
    const { year, month } = viewMonth.value
    return displayBills.value.filter((bill) => isBillActiveInMonth(bill, year, month))
  })

  return {
    bills: displayBills,
    billsInViewMonth,
    viewMonth,
    isCurrentMonth,
    isPastViewMonth,
    getBillById,
    setViewMonth,
    shiftViewMonth,
    goToCurrentMonth,
    addBill,
    updateBill,
    removeBill,
  }
}