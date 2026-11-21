import { computed, readonly, ref } from 'vue'
import { api } from '@/api/http'
import { bumpMoneyData } from '@/composables/moneyGeneration'
import {
  CURRENCIES,
  CURRENCY_META,
  isCurrency,
  type Currency,
  type FxRates,
  type MoneyRow,
} from '@/types/currency'

interface CurrencySettingsApi {
  currency: Currency
  rates: FxRates
  marketRates: FxRates
  irrPerUsd: number | null
  source: string
  fetchedAt: string | null
}

const STORAGE_KEY = 'money-managment:currency'

function loadStoredCurrency(): Currency {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isCurrency(stored) ? stored : 'IRR'
}

function unitRates(): FxRates {
  return { USD: 1, EUR: 1, GBP: 1, IRR: 1 }
}

const currency = ref<Currency>(loadStoredCurrency())
const rates = ref<FxRates>(unitRates())
const marketRates = ref<FxRates>(unitRates())
const irrPerUsd = ref<number | null>(null)
const source = ref('')
const fetchedAt = ref<string | null>(null)
const ratesReady = ref(false)

function apply(settings: CurrencySettingsApi): void {
  currency.value = isCurrency(settings.currency) ? settings.currency : 'IRR'
  rates.value = settings.rates
  marketRates.value = settings.marketRates
  irrPerUsd.value = settings.irrPerUsd
  source.value = settings.source
  fetchedAt.value = settings.fetchedAt
  ratesReady.value = true
  localStorage.setItem(STORAGE_KEY, currency.value)
}

export function roundMoney(value: number, code: Currency): number {
  const factor = 10 ** CURRENCY_META[code].decimals
  return Math.round(value * factor) / factor
}

/**
 * Converts an amount entered in `from` into the user's display currency.
 * Unrounded so sums across rows don't drift; `formatMoney` rounds for display.
 */
export function convertAmount(amount: number, from: Currency): number {
  const to = currency.value
  if (from === to) return amount
  return (amount / rates.value[from]) * rates.value[to]
}

export function withDisplayAmount<T extends MoneyRow>(row: T): T {
  return { ...row, amount: convertAmount(row.originalAmount, row.currency) }
}

export function displayCurrency(): Currency {
  return currency.value
}

export async function loadCurrency(): Promise<void> {
  apply(await api<CurrencySettingsApi>('/api/currency'))
}

export function clearCurrency(): void {
  rates.value = unitRates()
  marketRates.value = unitRates()
  irrPerUsd.value = null
  source.value = ''
  fetchedAt.value = null
  ratesReady.value = false
}

async function patchSettings(body: { currency?: Currency; irrPerUsd?: number | null }) {
  apply(
    await api<CurrencySettingsApi>('/api/currency', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  )
  bumpMoneyData()
}

export function useCurrency() {
  const meta = computed(() => CURRENCY_META[currency.value])

  async function setCurrency(code: Currency): Promise<void> {
    if (code === currency.value) return
    const wasJalali = currency.value === 'IRR'
    await patchSettings({ currency: code })
    const isJalali = currency.value === 'IRR'
    if (wasJalali !== isJalali) {
      const { reloadMoneyCollectionsForCalendar } = await import(
        '@/composables/loadMoneyCollections'
      )
      await reloadMoneyCollectionsForCalendar()
    }
  }

  async function setIrrMarketRate(value: number | null): Promise<void> {
    await patchSettings({ irrPerUsd: value })
  }

  return {
    currencies: CURRENCIES,
    currency: readonly(currency),
    meta,
    rates: readonly(rates),
    marketRates: readonly(marketRates),
    irrPerUsd: readonly(irrPerUsd),
    source: readonly(source),
    fetchedAt: readonly(fetchedAt),
    ratesReady: readonly(ratesReady),
    setCurrency,
    setIrrMarketRate,
  }
}
