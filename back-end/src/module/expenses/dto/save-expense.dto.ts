import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EXPENSE_CATEGORIES } from '../../../common/money/types.js';

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

  @IsInt()
  @Min(1200)
  @Max(1600)
  jalaliYear!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  jalaliMonth!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  jalaliDay!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string | null;
}
