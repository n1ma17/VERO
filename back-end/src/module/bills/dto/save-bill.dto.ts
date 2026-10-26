import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SaveBillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsInt()
  @Min(1)
  amount!: number;

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

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  logoUrl?: string | null;
}
