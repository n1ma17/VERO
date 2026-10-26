import { computed, ref } from 'vue'
import { api } from '@/api/http'
import type { JalaliMonth } from '@/types/bill'
import type { Installment } from '@/types/installment'
import { currentJalaliMonth, monthToIndex } from '@/utils/jalali'

const VIEW_KEY = 'money-managment:installments-view-month'

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

function isInViewMonth(installment: Installment, year: number, month: number): boolean {
  return installment.dueYear === year && installment.dueMonth === month
}

const installments = ref<Installment[]>([])
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export function replaceInstallments(next: Installment[]): void {
  installments.value = next
}

export function getInstallmentsSnapshot(): Installment[] {
  return installments.value
}

export async function refreshInstallments(): Promise<void> {
  installments.value = await api<Installment[]>('/api/installments')
}

export function useInstallments() {
  const allInstallments = computed<Installment[]>(() =>
    [...installments.value].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  )

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
    localStorage.setItem(VIEW_KEY, JSON.stringify(viewMonth.value))
  }

  async function setPaid(id: string, paid: boolean) {
    const updated = await api<Installment>(`/api/installments/${encodeURIComponent(id)}/paid`, {
      method: 'PATCH',
      body: JSON.stringify({ paid }),
    })
    installments.value = installments.value.map((item) => (item.id === updated.id ? updated : item))
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
