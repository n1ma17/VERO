export const CURRENCIES = ['USD', 'EUR', 'GBP', 'IRR'] as const

export type Currency = (typeof CURRENCIES)[number]

/** Units of each currency per 1 USD. */
export type FxRates = Record<Currency, number>

export interface CurrencyMeta {
  code: Currency
  name: string
  symbol: string
  decimals: number
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  IRR: { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', decimals: 0 },
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
}

/** Row amount as entered plus the display-converted `amount`. */
export interface MoneyRow {
  amount: number
  originalAmount: number
  currency: Currency
}
