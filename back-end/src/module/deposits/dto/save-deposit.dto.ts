import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SaveDepositDto {
  @IsInt()
  @Min(1)
  amount!: number;

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
