import { computed, ref, watch } from 'vue'
import { useBills } from '@/composables/useBills'
import type { Bill, JalaliMonth } from '@/types/bill'
import type { Installment } from '@/types/installment'
import {
  buildInstallmentsFromBills,
  installmentPaymentKey,
  parseInstallmentId,
} from '@/utils/billInstallments'
import { currentJalaliMonth, monthToIndex } from '@/utils/jalali'

const PAYMENTS_KEY = 'money-managment:installment-payments'
const VIEW_KEY = 'money-managment:installments-view-month'
const LEGACY_INSTALLMENTS_KEY = 'money-managment:installments'

function loadPayments(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PAYMENTS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as JalaliMonth
      const now = currentJalaliMonth()
      if (monthToIndex(parsed.year, parsed.month) >= monthToIndex(now.year, now.month)) {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  return currentJalaliMonth()
}

const payments = ref<Record<string, string>>(loadPayments())
const viewMonth = ref<JalaliMonth>(loadViewMonth())

localStorage.removeItem(LEGACY_INSTALLMENTS_KEY)

watch(
  payments,
  (value) => localStorage.setItem(PAYMENTS_KEY, JSON.stringify(value)),
  { deep: true },
)
watch(viewMonth, (value) => localStorage.setItem(VIEW_KEY, JSON.stringify(value)), { deep: true })

function isInViewMonth(installment: Installment, year: number, month: number): boolean {
  return installment.dueYear === year && installment.dueMonth === month
}

export function useInstallments() {
  const { bills } = useBills()

  const allInstallments = computed<Installment[]>(() => {
    const items = buildInstallmentsFromBills([...bills.value] as Bill[], payments.value)
    return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  })

  const installmentsInViewMonth = computed(() => {
    const { year, month } = viewMonth.value
    return allInstallments.value.filter((item) => isInViewMonth(item, year, month))
  })

  const canViewPreviousMonth = computed(() => {
    const now = currentJalaliMonth()
    return (
      monthToIndex(viewMonth.value.year, viewMonth.value.month) >
      monthToIndex(now.year, now.month)
    )
  })

  function setViewMonth(year: number, month: number) {
    viewMonth.value = { year, month }
  }

  function setPaid(id: string, paid: boolean) {
    const parsed = parseInstallmentId(id)
    if (!parsed) return

    const key = installmentPaymentKey(parsed.billId, parsed.year, parsed.month)
    const next = { ...payments.value }
    if (paid) next[key] = new Date().toISOString()
    else delete next[key]
    payments.value = next
  }

  return {
    allInstallments,
    installments: installmentsInViewMonth,
    viewMonth,
    canViewPreviousMonth,
    setViewMonth,
    setPaid,
  }
}
