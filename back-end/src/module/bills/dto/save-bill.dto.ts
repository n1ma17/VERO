import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SaveBillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsInt()
  @Min(1200)
  @Max(1600)
  startYear!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  startMonth!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @IsInt()
  @Min(1)
  @Max(60)
  durationMonths!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  logoUrl?: string | null;
}
