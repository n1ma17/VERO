import { readonly, ref } from 'vue'
import { api } from '@/api/http'
import { persistBillLogo } from '@/composables/useBillLogos'
import { refreshInstallments } from '@/composables/useInstallments'
import type { Bill, NewBill } from '@/types/bill'

const bills = ref<Bill[]>([])

export function replaceBills(next: Bill[]): void {
  bills.value = next
}

export function getBillsSnapshot(): Bill[] {
  return bills.value
}

export function useBills() {
  function getBillById(id: string): Bill | undefined {
    return bills.value.find((bill) => bill.id === id)
  }

  async function addBill(input: NewBill & { durationMonths: number }): Promise<Bill> {
    const bill = await api<Bill>('/api/bills', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        amount: input.amount,
        startYear: input.startYear,
        startMonth: input.startMonth,
        dueDay: input.dueDay,
        durationMonths: input.durationMonths,
        logoUrl: input.logoUrl ?? undefined,
      }),
    })
    if (input.logoUrl) await persistBillLogo(bill.id, input.logoUrl)
    bills.value = [bill, ...bills.value]
    await refreshInstallments()
    return bill
  }

  async function updateBill(
    id: string,
    input: NewBill & { durationMonths: number },
  ): Promise<Bill | null> {
    const bill = await api<Bill>(`/api/bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: input.title,
        amount: input.amount,
        startYear: input.startYear,
        startMonth: input.startMonth,
        dueDay: input.dueDay,
        durationMonths: input.durationMonths,
        logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl,
      }),
    })
    if (input.logoUrl) await persistBillLogo(id, input.logoUrl)
    else if (input.logoUrl === null) await persistBillLogo(id, null)
    bills.value = bills.value.map((item) => (item.id === id ? bill : item))
    await refreshInstallments()
    return bill
  }

  return {
    bills: readonly(bills),
    getBillById,
    addBill,
    updateBill,
  }
}
