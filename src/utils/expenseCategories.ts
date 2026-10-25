import type { ExpenseCategory } from '@/types/expense'

export interface ExpenseCategoryMeta {
  label: string
  tile: string
  dot: string
  fill: string
  stroke: string
  strip: string
}

/** Rotates the five brand colors for category chips and charts. */
const categoryPalette: Omit<ExpenseCategoryMeta, 'label'>[] = [
  {
    tile: 'bg-success text-background',
    dot: 'bg-success',
    fill: 'fill-success',
    stroke: 'stroke-success',
    strip: 'bg-success',
  },
  {
    tile: 'bg-accent text-text',
    dot: 'bg-accent',
    fill: 'fill-accent',
    stroke: 'stroke-accent',
    strip: 'bg-accent',
  },
  {
    tile: 'bg-warning text-text',
    dot: 'bg-warning',
    fill: 'fill-warning',
    stroke: 'stroke-warning',
    strip: 'bg-warning',
  },
  {
    tile: 'bg-danger text-background',
    dot: 'bg-danger',
    fill: 'fill-danger',
    stroke: 'stroke-danger',
    strip: 'bg-danger',
  },
  {
    tile: 'bg-primary text-background',
    dot: 'bg-primary',
    fill: 'fill-primary',
    stroke: 'stroke-primary',
    strip: 'bg-primary',
  },
]

function paletteFor(index: number): Omit<ExpenseCategoryMeta, 'label'> {
  return categoryPalette[index % categoryPalette.length]
}

export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  'food',
  'groceries',
  'home',
  'clothing',
  'entertainment',
  'transport',
  'car',
  'motorcycle',
  'beauty',
  'health',
  'other',
]

function category(label: string, paletteIndex: number): ExpenseCategoryMeta {
  return { ...paletteFor(paletteIndex), label }
}

export const expenseCategories: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  food: category('Food & dining', 0),
  groceries: category('Groceries', 1),
  home: category('Home', 2),
  clothing: category('Clothing', 3),
  entertainment: category('Entertainment', 4),
  transport: category('Transport', 0),
  car: category('Car', 1),
  motorcycle: category('Motorcycle', 2),
  beauty: category('Beauty', 3),
  health: category('Health', 4),
  other: {
    label: 'Other',
    tile: 'bg-primary/15 text-text',
    dot: 'bg-primary/40',
    fill: 'fill-primary/40',
    stroke: 'stroke-primary/40',
    strip: 'bg-primary/20',
  },
}

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && value in expenseCategories
}
