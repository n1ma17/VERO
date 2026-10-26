import { computed, readonly, ref } from 'vue'
import { api } from '@/api/http'
import { evictBillLogo, persistBillLogo } from '@/composables/useBillLogos'
import { refreshInstallments } from '@/composables/useInstallments'
import type { Bill, JalaliMonth, NewBill } from '@/types/bill'
import { billFromApi, billToApi, type BillApi } from '@/utils/moneyApi'
import { currentJalaliMonth, indexToMonth, monthToIndex } from '@/utils/jalali'

const VIEW_KEY = 'money-managment:bills-view-month'

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return JSON.parse(raw) as JalaliMonth
  } catch {
    /* ignore */
  }
  return currentJalaliMonth()
}

const bills = ref<Bill[]>([])
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export async function loadBills(): Promise<void> {
  const rows = await api<BillApi[]>('/api/bills')
  bills.value = rows.map(billFromApi)
}

export function clearBills(): void {
  bills.value = []
}

export function getBillsSnapshot(): Bill[] {
  return bills.value
}

export function useBills() {
  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))

  const isCurrentMonth = computed(() => {
    const now = currentJalaliMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  function getBillById(id: string): Bill | undefined {
    return bills.value.find((bill) => bill.id === id)
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
    const now = currentJalaliMonth()
    setViewMonth(now.year, now.month)
  }

  async function addBill(input: NewBill & { durationMonths: number }): Promise<Bill> {
    const payload = billToApi(input)
    const row = await api<BillApi>('/api/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const bill = billFromApi(row)
    if (input.logoUrl) await persistBillLogo(bill.id, input.logoUrl)
    bills.value = [bill, ...bills.value]
    await refreshInstallments()
    return bill
  }

  async function updateBill(
    id: string,
    input: NewBill & { durationMonths: number },
  ): Promise<Bill | null> {
    const payload = billToApi(input)
    const row = await api<BillApi>(`/api/bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...payload,
        logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl,
      }),
    })
    const bill = billFromApi(row)
    if (input.logoUrl) await persistBillLogo(id, input.logoUrl)
    else if (input.logoUrl === null) await persistBillLogo(id, null)
    bills.value = bills.value.map((item) => (item.id === id ? bill : item))
    await refreshInstallments()
    return bill
  }

  async function removeBill(id: string): Promise<void> {
    await api(`/api/bills/${id}`, { method: 'DELETE' })
    evictBillLogo(id)
    bills.value = bills.value.filter((item) => item.id !== id)
    await refreshInstallments()
  }

  return {
    bills: readonly(bills),
    viewMonth,
    isCurrentMonth,
    getBillById,
    setViewMonth,
    shiftViewMonth,
    goToCurrentMonth,
    addBill,
    updateBill,
    removeBill,
  }
}
