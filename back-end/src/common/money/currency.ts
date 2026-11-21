export const CURRENCIES = ['USD', 'EUR', 'GBP', 'IRR'] as const;

export type Currency = (typeof CURRENCIES)[number];

/** Units of each currency per 1 USD. */
export type FxRates = Record<Currency, number>;

const DECIMALS: Record<Currency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  IRR: 0,
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

export function roundMoney(value: number, currency: Currency): number {
  const factor = 10 ** DECIMALS[currency];
  return Math.round(value * factor) / factor;
}

export function fromUsd(usd: number, currency: Currency, rates: FxRates): number {
  return roundMoney(usd * rates[currency], currency);
}
