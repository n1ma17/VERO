import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_SLUG = /^[a-z][a-z0-9-]{0,47}$/;

export class SaveExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(1)
  amount!: number;

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
