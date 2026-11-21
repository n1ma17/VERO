import { IsIn, IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { CURRENCIES, type Currency } from '../../../common/money/currency.js';

export class UpdateCurrencyDto {
  @IsOptional()
  @IsIn(CURRENCIES)
  currency?: Currency;

  /** Free-market IRR per USD; `null` falls back to the official API rate. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 4, allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(100_000_000)
  irrPerUsd?: number | null;
}
