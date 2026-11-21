import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../../common/money/currency.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_SLUG = /^[a-z][a-z0-9-]{0,47}$/;

export class SaveExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  amount!: number;

  @IsIn(CURRENCIES)
  currency!: Currency;

  @IsString()
  @MinLength(1)
  @MaxLength(48)
  @Matches(CATEGORY_SLUG)
  category!: string;

  @IsString()
  @Matches(ISO_DATE)
  occurredOn!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string | null;
}
