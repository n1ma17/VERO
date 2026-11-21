import { computed, readonly, ref } from 'vue'
import type { ExpenseCategoryColorToken } from '@/utils/expenseCategoryStyles'
import {
  expenseCategoryColorLabels,
  EXPENSE_CATEGORY_COLOR_TOKENS,
  isExpenseCategoryColorToken,
  metaFromColorToken,
  type ExpenseCategoryMeta,
} from '@/utils/expenseCategoryStyles'

const STORAGE_KEY = 'money-managment:expense-categories'

export interface ExpenseCategoryDefinition {
  id: string
  label: string
  color: ExpenseCategoryColorToken
  hidden?: boolean
}

const DEFAULT_DEFINITIONS: ExpenseCategoryDefinition[] = [
  { id: 'food', label: 'Food & dining', color: 'stamp-approved' },
  { id: 'groceries', label: 'Groceries', color: 'accent' },
  { id: 'home', label: 'Home', color: 'status-unpaid' },
  { id: 'clothing', label: 'Clothing', color: 'status-paid' },
  { id: 'entertainment', label: 'Entertainment', color: 'deposit-card-lilac' },
  { id: 'transport', label: 'Transport', color: 'text' },
  { id: 'car', label: 'Car', color: 'deposit-card-sky' },
  { id: 'motorcycle', label: 'Motorcycle', color: 'deposit-card-mint' },
  { id: 'beauty', label: 'Beauty', color: 'deposit-card-rose' },
  { id: 'health', label: 'Health', color: 'status-overdue' },
  { id: 'other', label: 'Other', color: 'text' },
]

const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,47}$/

const definitions = ref<ExpenseCategoryDefinition[]>(loadFromStorage())

function loadFromStorage(): ExpenseCategoryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_DEFINITIONS]
    const parsed = JSON.parse(raw) as ExpenseCategoryDefinition[]
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_DEFINITIONS]
    return parsed.filter(isValidDefinition)
  } catch {
    return [...DEFAULT_DEFINITIONS]
  }
}

function isValidDefinition(row: ExpenseCategoryDefinition): boolean {
  return (
    typeof row.id === 'string' &&
    SLUG_PATTERN.test(row.id) &&
    typeof row.label === 'string' &&
    row.label.trim().length > 0 &&
    isExpenseCategoryColorToken(row.color)
  )
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions.value))
}

function slugFromLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const stem = base.length > 0 ? base : 'category'
  let id = stem
  let n = 2
  while (definitions.value.some((item) => item.id === id)) {
    id = `${stem}-${n}`
    n += 1
  }
  return id
}

export function isExpenseCategorySlug(value: unknown): value is string {
  return typeof value === 'string' && SLUG_PATTERN.test(value)
}

export function categoryMeta(categoryId: string): ExpenseCategoryMeta {
  const row = definitions.value.find((item) => item.id === categoryId)
  if (row) return metaFromColorToken(row.label, row.color)
  const label = categoryId.replace(/-/g, ' ')
  return metaFromColorToken(label.charAt(0).toUpperCase() + label.slice(1), 'text')
}

export function useExpenseCategoryCatalog() {
  const visibleCategories = computed(() =>
    definitions.value.filter((item) => !item.hidden),
  )

  const orderedIds = computed(() => visibleCategories.value.map((item) => item.id))

  function addCategory(label: string, color: ExpenseCategoryColorToken): ExpenseCategoryDefinition {
    const row: ExpenseCategoryDefinition = {
      id: slugFromLabel(label),
      label: label.trim(),
      color,
    }
    definitions.value = [...definitions.value, row]
    persist()
    return row
  }

  function updateCategory(
    id: string,
    patch: { label?: string; color?: ExpenseCategoryColorToken; hidden?: boolean },
  ): void {
    definitions.value = definitions.value.map((item) => {
      if (item.id !== id) return item
      return {
        ...item,
        ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
        ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
      }
    })
    persist()
  }

  function removeCategory(id: string): boolean {
    if (definitions.value.length <= 1) return false
    definitions.value = definitions.value.filter((item) => item.id !== id)
    persist()
    return true
  }

  function resetToDefaults(): void {
    definitions.value = [...DEFAULT_DEFINITIONS]
    persist()
  }

  return {
    definitions: readonly(definitions),
    visibleCategories,
    orderedIds,
    colorOptions: EXPENSE_CATEGORY_COLOR_TOKENS,
    colorLabels: expenseCategoryColorLabels,
    categoryMeta,
    addCategory,
    updateCategory,
    removeCategory,
    resetToDefaults,
  }
}