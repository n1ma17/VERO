export interface ExpenseCategoryMeta {
  label: string
  tile: string
  dot: string
  fill: string
  stroke: string
  strip: string
}

export const EXPENSE_CATEGORY_COLOR_TOKENS = [
  'accent',
  'text',
  'stamp-approved',
  'status-paid',
  'status-unpaid',
  'status-overdue',
  'deposit-card-sky',
  'deposit-card-mint',
  'deposit-card-lilac',
  'deposit-card-rose',
  'deposit-card-peach',
] as const

export type ExpenseCategoryColorToken = (typeof EXPENSE_CATEGORY_COLOR_TOKENS)[number]

export const expenseCategoryColorLabels: Record<ExpenseCategoryColorToken, string> = {
  accent: 'Signal orange',
  text: 'Steel',
  'stamp-approved': 'Mint',
  'status-paid': 'Sky blue',
  'status-unpaid': 'Sand',
  'status-overdue': 'Rose',
  'deposit-card-sky': 'Violet',
  'deposit-card-mint': 'Green',
  'deposit-card-lilac': 'Lilac',
  'deposit-card-rose': 'Pink',
  'deposit-card-peach': 'White',
}

const colorTokenClasses: Record<ExpenseCategoryColorToken, Omit<ExpenseCategoryMeta, 'label'>> = {
  accent: {
    tile: 'bg-accent text-on-accent',
    dot: 'bg-accent',
    fill: 'fill-accent',
    stroke: 'stroke-accent',
    strip: 'bg-accent',
  },
  text: {
    tile: 'bg-text text-background',
    dot: 'bg-text',
    fill: 'fill-text',
    stroke: 'stroke-text',
    strip: 'bg-text',
  },
  'stamp-approved': {
    tile: 'bg-stamp-approved text-background',
    dot: 'bg-stamp-approved',
    fill: 'fill-stamp-approved',
    stroke: 'stroke-stamp-approved',
    strip: 'bg-stamp-approved',
  },
  'status-paid': {
    tile: 'bg-status-paid text-background',
    dot: 'bg-status-paid',
    fill: 'fill-status-paid',
    stroke: 'stroke-status-paid',
    strip: 'bg-status-paid',
  },
  'status-unpaid': {
    tile: 'bg-status-unpaid text-background',
    dot: 'bg-status-unpaid',
    fill: 'fill-status-unpaid',
    stroke: 'stroke-status-unpaid',
    strip: 'bg-status-unpaid',
  },
  'status-overdue': {
    tile: 'bg-status-overdue text-background',
    dot: 'bg-status-overdue',
    fill: 'fill-status-overdue',
    stroke: 'stroke-status-overdue',
    strip: 'bg-status-overdue',
  },
  'deposit-card-sky': {
    tile: 'bg-deposit-card-sky text-on-accent',
    dot: 'bg-deposit-card-sky',
    fill: 'fill-deposit-card-sky',
    stroke: 'stroke-deposit-card-sky',
    strip: 'bg-deposit-card-sky',
  },
  'deposit-card-mint': {
    tile: 'bg-deposit-card-mint text-background',
    dot: 'bg-deposit-card-mint',
    fill: 'fill-deposit-card-mint',
    stroke: 'stroke-deposit-card-mint',
    strip: 'bg-deposit-card-mint',
  },
  'deposit-card-lilac': {
    tile: 'bg-deposit-card-lilac text-on-accent',
    dot: 'bg-deposit-card-lilac',
    fill: 'fill-deposit-card-lilac',
    stroke: 'stroke-deposit-card-lilac',
    strip: 'bg-deposit-card-lilac',
  },
  'deposit-card-rose': {
    tile: 'bg-deposit-card-rose text-background',
    dot: 'bg-deposit-card-rose',
    fill: 'fill-deposit-card-rose',
    stroke: 'stroke-deposit-card-rose',
    strip: 'bg-deposit-card-rose',
  },
  'deposit-card-peach': {
    tile: 'bg-deposit-card-peach text-deposit-card-ink-blue',
    dot: 'bg-deposit-card-peach',
    fill: 'fill-deposit-card-peach',
    stroke: 'stroke-deposit-card-peach',
    strip: 'bg-deposit-card-peach',
  },
}

export function metaFromColorToken(
  label: string,
  token: ExpenseCategoryColorToken,
): ExpenseCategoryMeta {
  return { label, ...colorTokenClasses[token] }
}

export function isExpenseCategoryColorToken(value: unknown): value is ExpenseCategoryColorToken {
  return (
    typeof value === 'string' &&
    (EXPENSE_CATEGORY_COLOR_TOKENS as readonly string[]).includes(value)
  )
}