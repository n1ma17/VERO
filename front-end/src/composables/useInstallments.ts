import { computed, ref } from 'vue'
import { api } from '@/api/http'
import { bumpMoneyData } from '@/composables/moneyGeneration'
import { withDisplayAmount } from '@/composables/useCurrency'
import type { JalaliMonth } from '@/types/bill'
import type { Installment } from '@/types/installment'
import { sanitizeViewMonth } from '@/composables/viewMonthSync'
import {
  currentCalendarMonth,
  indexToMonth,
  isBeforeCurrentCalendarMonth,
  monthToIndex,
} from '@/utils/calendar'
import { installmentFromApi, type InstallmentApi } from '@/utils/moneyApi'

const VIEW_KEY = 'money-managment:installments-view-month'

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return sanitizeViewMonth(JSON.parse(raw) as JalaliMonth)
  } catch {
    /* ignore */
  }
  return currentCalendarMonth()
}

function isInViewMonth(installment: Installment, year: number, month: number): boolean {
  return installment.dueYear === year && installment.dueMonth === month
}

const installments = ref<Installment[]>([])
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export async function loadInstallments(): Promise<void> {
  const rows = await api<InstallmentApi[]>('/api/installments')
  installments.value = rows.map(installmentFromApi)
}

export function clearInstallments(): void {
  installments.value = []
}

export function resetInstallmentsViewMonth(): void {
  const now = currentCalendarMonth()
  viewMonth.value = now
  localStorage.setItem(VIEW_KEY, JSON.stringify(now))
}

export function alignInstallmentsViewMonth(): void {
  viewMonth.value = loadViewMonth()
  localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
}

export function getInstallmentsSnapshot(): Installment[] {
  return installments.value
}

export async function refreshInstallments(): Promise<void> {
  await loadInstallments()
}

export function useInstallments() {
  const allInstallments = computed<Installment[]>(() =>
    installments.value
      .map(withDisplayAmount)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  )

  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))

  const isCurrentMonth = computed(() => {
    const now = currentCalendarMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  const isPastViewMonth = computed(() => isBeforeCurrentCalendarMonth(viewMonth.value.year, viewMonth.value.month))

  const installmentsInViewMonth = computed(() => {
    const { year, month } = viewMonth.value
    return allInstallments.value.filter((item) => isInViewMonth(item, year, month))
  })

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

  async function setPaid(id: string, paid: boolean) {
    const updated = installmentFromApi(
      await api<InstallmentApi>(`/api/installments/${encodeURIComponent(id)}/paid`, {
        method: 'PATCH',
        body: JSON.stringify({ paid }),
      }),
    )
    installments.value = installments.value.map((item) => (item.id === updated.id ? updated : item))
    bumpMoneyData()
  }

  return {
    allInstallments,
    installments: installmentsInViewMonth,
    viewMonth,
    isCurrentMonth,
    isPastViewMonth,
    setViewMonth,
    shiftViewMonth,
    goToCurrentMonth,
    setPaid,
  }
}