import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SaveDepositDto {
  @IsInt()
  @Min(1)
  amount!: number;

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

  @IsInt()
  @Min(1200)
  @Max(1600)
  bookedYear!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  bookedMonth!: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string | null;
}
