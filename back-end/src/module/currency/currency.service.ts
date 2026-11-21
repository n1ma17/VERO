import { Injectable, NotFoundException } from '@nestjs/common';
import { isCurrency } from '../../common/money/currency.js';
import type { CurrencySettingsDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import { FxService } from '../../lib/fx/fx.service.js';
import type { UpdateCurrencyDto } from './dto/update-currency.dto.js';

@Injectable()
export class CurrencyService {
  constructor(
    private readonly pg: PgService,
    private readonly fx: FxService,
  ) {}

  async getSettings(userId: string): Promise<CurrencySettingsDto> {
    await this.fx.ensureFresh();
    const [userResult, rates, market] = await Promise.all([
      this.pg.query<{ currency: string; irr_per_usd: string | number | null }>(
        'SELECT currency, irr_per_usd FROM users WHERE id = $1',
        [userId],
      ),
      this.fx.getUserRates(userId),
      this.fx.getMarketRates(),
    ]);
    const user = userResult.rows[0];
    if (!user) throw new NotFoundException('User not found');
    return {
      currency: isCurrency(user.currency) ? user.currency : 'IRR',
      rates,
      marketRates: market.rates,
      irrPerUsd: user.irr_per_usd === null ? null : Number(user.irr_per_usd),
      source: market.source,
      fetchedAt: market.fetchedAt,
    };
  }

  async update(userId: string, dto: UpdateCurrencyDto): Promise<CurrencySettingsDto> {
    const sets: string[] = [];
    const values: unknown[] = [userId];
    if (dto.currency !== undefined) {
      values.push(dto.currency);
      sets.push(`currency = $${values.length}`);
    }
    if (dto.irrPerUsd !== undefined) {
      values.push(dto.irrPerUsd);
      sets.push(`irr_per_usd = $${values.length}`);
    }
    if (sets.length) {
      const { rowCount } = await this.pg.query(
        `UPDATE users SET ${sets.join(', ')} WHERE id = $1`,
        values,
      );
      if (!rowCount) throw new NotFoundException('User not found');
    }
    return this.getSettings(userId);
  }
}
