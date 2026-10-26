import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EXPENSE_CATEGORIES } from '../../../common/money/types.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SaveExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsIn(EXPENSE_CATEGORIES)
  category!: (typeof EXPENSE_CATEGORIES)[number];

  @IsString()
  @Matches(ISO_DATE)
  occurredOn!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string | null;
}
