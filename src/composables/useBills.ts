import { readonly, ref, watch } from 'vue'
import { persistBillLogo } from '@/composables/useBillLogos'
import type { Bill, NewBill } from '@/types/bill'
import { setBillLogo } from '@/utils/billLogoStore'
import { clampDueDay } from '@/utils/jalali'

const STORAGE_KEY = 'money-managment:bills'

function loadBills(): Bill[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Bill[]
    return raw.map((bill) => ({
      ...bill,
      dueDay: bill.dueDay ?? 1,
      logoKey: bill.logoKey ?? null,
      logoUrl: bill.logoUrl ?? null,
    }))
  } catch {
    return []
  }
}

const bills = ref<Bill[]>(loadBills())
let logosMigrated = false

async function migrateEmbeddedLogos() {
  if (logosMigrated) return
  logosMigrated = true

  for (const bill of bills.value) {
    if (!bill.logoUrl) continue
    await setBillLogo(bill.id, bill.logoUrl)
    bill.logoKey = bill.id
    bill.logoUrl = null
  }
}

void migrateEmbeddedLogos()

watch(
  bills,
  (value) => {
    const payload = value.map(({ logoUrl: _drop, ...bill }) => bill)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  },
  { deep: true },
)

export function useBills() {
  function getBillById(id: string): Bill | undefined {
    return bills.value.find((bill) => bill.id === id)
  }

  async function addBill(input: NewBill & { durationMonths: number }): Promise<Bill> {
    const duration = Math.min(60, Math.max(1, Math.round(input.durationMonths)))
    const dueDay = clampDueDay(input.dueDay, input.startYear, input.startMonth)
    const id = crypto.randomUUID()

    let logoKey: string | null = null
    if (input.logoUrl) {
      await persistBillLogo(id, input.logoUrl)
      logoKey = id
    }

    const bill: Bill = {
      title: input.title,
      amount: input.amount,
      startYear: input.startYear,
      startMonth: input.startMonth,
      dueDay,
      durationMonths: duration,
      logoKey,
      id,
      createdAt: new Date().toISOString(),
    }
    bills.value.unshift(bill)
    return bill
  }

  async function updateBill(
    id: string,
    input: NewBill & { durationMonths: number },
  ): Promise<Bill | null> {
    const index = bills.value.findIndex((bill) => bill.id === id)
    if (index === -1) return null

    const existing = bills.value[index]
    const duration = Math.min(60, Math.max(1, Math.round(input.durationMonths)))
    const dueDay = clampDueDay(input.dueDay, input.startYear, input.startMonth)

    let logoKey = existing.logoKey
    if (input.logoUrl) {
      await persistBillLogo(id, input.logoUrl)
      logoKey = id
    } else if (input.logoUrl === null && existing.logoKey) {
      await persistBillLogo(id, null)
      logoKey = null
    }

    const updated: Bill = {
      ...existing,
      title: input.title,
      amount: input.amount,
      startYear: input.startYear,
      startMonth: input.startMonth,
      dueDay,
      durationMonths: duration,
      logoKey,
    }
    bills.value[index] = updated
    return updated
  }

  return {
    bills: readonly(bills),
    getBillById,
    addBill,
    updateBill,
  }
}
