import type { ExpenseCategory } from '@/types/expense'

export interface ExpenseCategoryMeta {
  label: string
  /** Solid tile with readable text, e.g. category avatar. */
  tile: string
  /** Small swatch / legend dot. */
  dot: string
  /** SVG bar fill. */
  fill: string
  /** Donut segment. */
  stroke: string
  /** Receipt top strip. */
  strip: string
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

export const expenseCategories: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  food: {
    label: 'Food & dining',
    tile: 'bg-chart-8 text-on-primary',
    dot: 'bg-chart-8',
    fill: 'fill-chart-8',
    stroke: 'stroke-chart-8',
    strip: 'bg-chart-8',
  },
  groceries: {
    label: 'Groceries',
    tile: 'bg-chart-1 text-on-primary',
    dot: 'bg-chart-1',
    fill: 'fill-chart-1',
    stroke: 'stroke-chart-1',
    strip: 'bg-chart-1',
  },
  home: {
    label: 'Home',
    tile: 'bg-chart-4 text-on-primary',
    dot: 'bg-chart-4',
    fill: 'fill-chart-4',
    stroke: 'stroke-chart-4',
    strip: 'bg-chart-4',
  },
  clothing: {
    label: 'Clothing',
    tile: 'bg-chart-7 text-on-primary',
    dot: 'bg-chart-7',
    fill: 'fill-chart-7',
    stroke: 'stroke-chart-7',
    strip: 'bg-chart-7',
  },
  entertainment: {
    label: 'Entertainment',
    tile: 'bg-chart-2 text-content-on-surface',
    dot: 'bg-chart-2',
    fill: 'fill-chart-2',
    stroke: 'stroke-chart-2',
    strip: 'bg-chart-2',
  },
  transport: {
    label: 'Transport',
    tile: 'bg-chart-6 text-on-primary',
    dot: 'bg-chart-6',
    fill: 'fill-chart-6',
    stroke: 'stroke-chart-6',
    strip: 'bg-chart-6',
  },
  car: {
    label: 'Car',
    tile: 'bg-chart-10 text-on-primary',
    dot: 'bg-chart-10',
    fill: 'fill-chart-10',
    stroke: 'stroke-chart-10',
    strip: 'bg-chart-10',
  },
  motorcycle: {
    label: 'Motorcycle',
    tile: 'bg-chart-11 text-on-primary',
    dot: 'bg-chart-11',
    fill: 'fill-chart-11',
    stroke: 'stroke-chart-11',
    strip: 'bg-chart-11',
  },
  beauty: {
    label: 'Beauty',
    tile: 'bg-chart-9 text-on-primary',
    dot: 'bg-chart-9',
    fill: 'fill-chart-9',
    stroke: 'stroke-chart-9',
    strip: 'bg-chart-9',
  },
  health: {
    label: 'Health',
    tile: 'bg-chart-5 text-content-on-surface',
    dot: 'bg-chart-5',
    fill: 'fill-chart-5',
    stroke: 'stroke-chart-5',
    strip: 'bg-chart-5',
  },
  other: {
    label: 'Other',
    tile: 'bg-chart-muted text-content-on-surface',
    dot: 'bg-chart-muted',
    fill: 'fill-chart-muted',
    stroke: 'stroke-chart-muted',
    strip: 'bg-chart-muted',
  },
}

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && value in expenseCategories
}
