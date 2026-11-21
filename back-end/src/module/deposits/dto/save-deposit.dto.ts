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

export class SaveDepositDto {
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  amount!: number;

  @IsIn(CURRENCIES)
  currency!: Currency;

  @IsString()
  @Matches(ISO_DATE)
  arrivedOn!: string;

  @IsString()
  @Matches(ISO_DATE)
  bookedOn!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string | null;
}
