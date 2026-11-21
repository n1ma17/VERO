import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { CURRENCIES, type Currency, type FxRates } from '../../common/money/currency.js';
import { PgService } from '../database/pg.service.js';

const MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** Wait before retrying after a failed fetch so offline servers don't hammer the providers. */
const RETRY_AFTER_MS = 10 * 60 * 1000;
/** Both providers routinely take ~9s from Iranian networks. */
const FETCH_TIMEOUT_MS = 20_000;

type RateProvider = {
  source: string;
  url: string;
  /** Returns units per USD keyed by upper-case ISO code. */
  parse: (body: unknown) => Record<string, number> | null;
};

const PROVIDERS: RateProvider[] = [
  {
    source: 'open.er-api.com',
    url: 'https://open.er-api.com/v6/latest/USD',
    parse: (body) => {
      const data = body as { result?: string; rates?: Record<string, number> };
      return data.result === 'success' && data.rates ? data.rates : null;
    },
  },
  {
    source: 'fawazahmed0/currency-api',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
    parse: (body) => {
      const data = body as { usd?: Record<string, number> };
      if (!data.usd) return null;
      return Object.fromEntries(
        Object.entries(data.usd).map(([code, value]) => [code.toUpperCase(), value]),
      );
    },
  },
];

type RateRow = {
  currency: Currency;
  per_usd: string | number;
  source: string;
  fetched_at: Date;
};

export type MarketRates = {
  rates: FxRates;
  source: string;
  fetchedAt: string | null;
};

function emptyRates(): FxRates {
  return { USD: 1, EUR: 1, GBP: 1, IRR: 1 };
}

@Injectable()
export class FxService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FxService.name);
  private refreshing: Promise<void> | null = null;
  private lastFailureAt = 0;

  constructor(private readonly pg: PgService) {}

  onApplicationBootstrap(): void {
    void this.ensureFresh().catch(() => undefined);
  }

  /**
   * Starts a refresh when stored rates are older than six hours. Callers only wait
   * while the table still holds seed rates; otherwise stale rates are served and
   * the refresh finishes in the background. Never throws on provider failure.
   */
  async ensureFresh(): Promise<void> {
    const { rows } = await this.pg.query<{ fetched_at: Date | null; seeded: boolean }>(
      `SELECT min(fetched_at) AS fetched_at, bool_or(source = 'seed') AS seeded
         FROM fx_rates
        WHERE currency <> 'USD'`,
    );
    const fetchedAt = rows[0]?.fetched_at?.getTime() ?? 0;
    if (Date.now() - fetchedAt < MAX_AGE_MS) return;
    if (Date.now() - this.lastFailureAt < RETRY_AFTER_MS) return;
    this.refreshing ??= this.refresh().finally(() => {
      this.refreshing = null;
    });
    if (rows[0]?.seeded) await this.refreshing;
  }

  async getMarketRates(): Promise<MarketRates> {
    const { rows } = await this.pg.query<RateRow>(
      `SELECT currency, per_usd, source, fetched_at FROM fx_rates`,
    );
    const rates = emptyRates();
    let source = '';
    let fetchedAt: Date | null = null;
    for (const row of rows) {
      rates[row.currency] = Number(row.per_usd);
      if (row.currency === 'USD') continue;
      source ||= row.source;
      if (!fetchedAt || row.fetched_at < fetchedAt) fetchedAt = row.fetched_at;
    }
    const usable = fetchedAt && fetchedAt.getTime() > 0 ? fetchedAt.toISOString() : null;
    return { rates, source, fetchedAt: usable };
  }

  /** Effective rates for one user (manual IRR market rate wins over the API). */
  async getUserRates(userId: string): Promise<FxRates> {
    const { rows } = await this.pg.query<{ currency: Currency; per_usd: string | number }>(
      `SELECT currency, per_usd FROM v_user_fx WHERE user_id = $1`,
      [userId],
    );
    const rates = emptyRates();
    for (const row of rows) rates[row.currency] = Number(row.per_usd);
    return rates;
  }

  private async refresh(): Promise<void> {
    for (const provider of PROVIDERS) {
      try {
        const rates = await this.fetchProvider(provider);
        await this.store(rates, provider.source);
        this.lastFailureAt = 0;
        return;
      } catch (error) {
        const cause = error instanceof Error && error.cause instanceof Error ? error.cause : null;
        const message = error instanceof Error ? error.message : String(error);
        const detail = cause ? `${message} (${cause.message})` : message;
        this.logger.warn(`Exchange rates from ${provider.source} failed: ${detail}`);
      }
    }
    this.lastFailureAt = Date.now();
    this.logger.warn('All exchange rate providers failed; serving stored rates.');
  }

  private async fetchProvider(provider: RateProvider): Promise<Map<Currency, number>> {
    const response = await fetch(provider.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rates = provider.parse(await response.json());
    if (!rates) throw new Error('unexpected response body');
    const result = new Map<Currency, number>();
    for (const code of CURRENCIES) {
      if (code === 'USD') continue;
      const value = rates[code];
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new Error(`missing rate for ${code}`);
      }
      result.set(code, value);
    }
    return result;
  }

  private async store(rates: Map<Currency, number>, source: string): Promise<void> {
    await this.pg.transaction(async (client) => {
      for (const [code, value] of rates) {
        await client.query(
          `INSERT INTO fx_rates (currency, per_usd, source, fetched_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (currency) DO UPDATE
              SET per_usd = EXCLUDED.per_usd,
                  source = EXCLUDED.source,
                  fetched_at = EXCLUDED.fetched_at`,
          [code, value, source],
        );
      }
    });
  }
}
