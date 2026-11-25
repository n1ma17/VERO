import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CURRENCIES, type Currency } from '../../../common/money/currency.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SaveBillDto {
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
  @Matches(ISO_DATE)
  startOn!: string;

  @IsString()
  @Matches(ISO_DATE)
  endOn!: string;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  /** Null / omitted = Others. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID()
  companyId?: string | null;
}
