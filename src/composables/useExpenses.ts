import { computed, readonly, ref, watch } from 'vue'
import type { JalaliMonth } from '@/types/bill'
import type { Expense, ExpenseCategory, NewExpense } from '@/types/expense'
import { EXPENSE_CATEGORY_ORDER, isExpenseCategory } from '@/utils/expenseCategories'
import { clampDueDay, currentJalaliMonth, indexToMonth, monthToIndex } from '@/utils/jalali'

const STORAGE_KEY = 'money-managment:expenses'
const VIEW_KEY = 'money-managment:expenses-view-month'

function load(): Expense[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Expense[]
    return raw.map((expense) => ({
      ...expense,
      category: isExpenseCategory(expense.category) ? expense.category : 'other',
    }))
  } catch {
    return []
  }
}

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

const expenses = ref<Expense[]>(load())
const viewMonth = ref<JalaliMonth>(loadViewMonth())

watch(expenses, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), {
  deep: true,
})
watch(viewMonth, (value) => localStorage.setItem(VIEW_KEY, JSON.stringify(value)), { deep: true })

function normalize(input: NewExpense): NewExpense {
  return {
    title: input.title.trim(),
    amount: Math.round(input.amount),
    category: input.category,
    jalaliYear: input.jalaliYear,
    jalaliMonth: input.jalaliMonth,
    jalaliDay: clampDueDay(input.jalaliDay, input.jalaliYear, input.jalaliMonth),
    note: input.note?.trim() || null,
  }
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

  function addExpense(input: NewExpense): Expense {
    const expense: Expense = {
      ...normalize(input),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    expenses.value.unshift(expense)
    return expense
  }

  function updateExpense(id: string, input: NewExpense): Expense | null {
    const index = expenses.value.findIndex((expense) => expense.id === id)
    if (index === -1) return null
    const updated: Expense = { ...expenses.value[index], ...normalize(input) }
    expenses.value[index] = updated
    return updated
  }

  function removeExpense(id: string) {
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
