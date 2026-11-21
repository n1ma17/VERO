import { CURRENCY_META, type Currency } from '@/types/currency'

const integerFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatMoneyInputValue(value: number | null, currency: Currency): string {
  if (value === null || value <= 0) return ''
  const decimals = CURRENCY_META[currency].decimals
  const [whole, fraction] = value.toFixed(decimals).split('.')
  const grouped = integerFormatter.format(Number(whole))
  const trimmed = fraction?.replace(/0+$/, '')
  return trimmed ? `${grouped}.${trimmed}` : grouped
}

/** Keeps a trailing `.` or partial decimals while typing (e.g. `12.`, `12.5`). */
export function formatMoneyInputDraft(raw: string, currency: Currency): string {
  const decimals = CURRENCY_META[currency].decimals
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [wholeDigits = '', ...rest] = cleaned.split('.')
  const whole = wholeDigits.replace(/^0+(?=\d)/, '')
  const grouped = whole ? integerFormatter.format(Number(whole)) : ''
  if (decimals === 0 || rest.length === 0) return grouped
  const fraction = rest.join('').slice(0, decimals)
  return `${grouped || '0'}.${fraction}`
}

export function parseMoneyInput(raw: string, currency: Currency): number | null {
  const decimals = CURRENCY_META[currency].decimals
  const cleaned = raw.replace(/[^\d.]/g, '')
  const [wholeDigits = '', ...rest] = cleaned.split('.')
  const fraction = decimals ? rest.join('').slice(0, decimals) : ''
  const text = fraction ? `${wholeDigits || '0'}.${fraction}` : wholeDigits
  if (!text) return null
  const amount = Number(text)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return amount
}
