import { displayCurrency, roundMoney } from '@/composables/useCurrency'
import { CURRENCY_META, type Currency } from '@/types/currency'

const numberFormatters = new Map<number, Intl.NumberFormat>()
const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function numberFormatter(decimals: number): Intl.NumberFormat {
  let formatter = numberFormatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    numberFormatters.set(decimals, formatter)
  }
  return formatter
}

/** e.g. `$1,250.00`, `€80.50`, `1,550,000 IRR`. Defaults to the display currency. */
export function formatMoney(value: number, currency: Currency = displayCurrency()): string {
  const { decimals, symbol } = CURRENCY_META[currency]
  const rounded = roundMoney(value, currency)
  const sign = rounded < 0 ? '−' : ''
  const number = numberFormatter(decimals).format(Math.abs(rounded))
  if (currency === 'IRR') return `${sign}${number} IRR`
  return `${sign}${symbol}${number}`
}

/** Grouped number without the unit, for layouts that render `currencyUnit()` separately. */
export function formatMoneyNumber(value: number, currency: Currency = displayCurrency()): string {
  const rounded = roundMoney(value, currency)
  return numberFormatter(CURRENCY_META[currency].decimals).format(rounded === 0 ? 0 : rounded)
}

/** Short form for chart axes, e.g. `12.5M`. */
export function formatMoneyCompact(value: number): string {
  return compactFormatter.format(value)
}

/** Unit label shown next to bare numbers: `USD`, `EUR`, `GBP`, `IRR`. */
export function currencyUnit(currency: Currency = displayCurrency()): string {
  return currency
}
