import { computed, readonly, ref } from 'vue'
import { api } from '@/api/http'
import type { JalaliMonth } from '@/types/bill'
import type { Expense, ExpenseCategory, NewExpense } from '@/types/expense'
import { EXPENSE_CATEGORY_ORDER, isExpenseCategory } from '@/utils/expenseCategories'
import { clampDueDay, currentJalaliMonth, indexToMonth, monthToIndex } from '@/utils/jalali'
import { expenseFromApi, expenseToApi, type ExpenseApi } from '@/utils/moneyApi'

const VIEW_KEY = 'money-managment:expenses-view-month'

function loadViewMonth(): JalaliMonth {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (raw) return JSON.parse(raw) as JalaliMonth
  } catch {
    /* ignore */
  }
  return currentJalaliMonth()
}

function dateKey(expense: Pick<Expense, 'jalaliYear' | 'jalaliMonth' | 'jalaliDay'>): number {
  return expense.jalaliYear * 10000 + expense.jalaliMonth * 100 + expense.jalaliDay
}

function normalize(input: NewExpense): NewExpense {
  return {
    title: input.title.trim(),
    amount: Math.round(input.amount),
    category: isExpenseCategory(input.category) ? input.category : 'other',
    jalaliYear: input.jalaliYear,
    jalaliMonth: input.jalaliMonth,
    jalaliDay: clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth),
    note: input.note?.trim() || null,
  }
}

const expenses = ref<Expense[]>([])
const viewMonth = ref<JalaliMonth>(loadViewMonth())

export async function loadExpenses(): Promise<void> {
  const rows = await api<ExpenseApi[]>('/api/expenses')
  expenses.value = rows.map(expenseFromApi)
}

export function clearExpenses(): void {
  expenses.value = []
}

export function getExpensesSnapshot(): Expense[] {
  return expenses.value
}

export function useExpenses() {
  const viewIndex = computed(() => monthToIndex(viewMonth.value.year, viewMonth.value.month))

  const isCurrentMonth = computed(() => {
    const now = currentJalaliMonth()
    return viewIndex.value === monthToIndex(now.year, now.month)
  })

  const expensesInViewMonth = computed(() =>
    expenses.value
      .filter(
        (expense) =>
          expense.jalaliYear === viewMonth.value.year &&
          expense.jalaliMonth === viewMonth.value.month,
      )
      .sort((a, b) => dateKey(b) - dateKey(a)),
  )

  const monthTotal = computed(() =>
    expensesInViewMonth.value.reduce((sum, expense) => sum + expense.amount, 0),
  )

  const categoryTotals = computed(() => {
    const totals = new Map<ExpenseCategory, number>()
    for (const expense of expensesInViewMonth.value) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount)
    }
    return EXPENSE_CATEGORY_ORDER.filter((category) => totals.has(category))
      .map((category) => ({ category, amount: totals.get(category)! }))
      .sort((a, b) => b.amount - a.amount)
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
    const now = currentJalaliMonth()
    setViewMonth(now.year, now.month)
  }

  function getExpenseById(id: string): Expense | undefined {
    return expenses.value.find((expense) => expense.id === id)
  }

  async function addExpense(input: NewExpense): Promise<Expense> {
    const row = await api<ExpenseApi>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseToApi(normalize(input))),
    })
    const expense = expenseFromApi(row)
    expenses.value = [expense, ...expenses.value]
    return expense
  }

  async function updateExpense(id: string, input: NewExpense): Promise<Expense | null> {
    const row = await api<ExpenseApi>(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expenseToApi(normalize(input))),
    })
    const updated = expenseFromApi(row)
    expenses.value = expenses.value.map((expense) => (expense.id === id ? updated : expense))
    return updated
  }

  async function removeExpense(id: string) {
    await api(`/api/expenses/${id}`, { method: 'DELETE' })
    expenses.value = expenses.value.filter((expense) => expense.id !== id)
  }

  return {
    expenses: readonly(expenses),
    viewMonth,
    isCurrentMonth,
    expensesInViewMonth,
    monthTotal,
    categoryTotals,
    setViewMonth,
    shiftViewMonth,
    goToCurrentMonth,
    getExpenseById,
    addExpense,
    updateExpense,
    removeExpense,
  }
}
