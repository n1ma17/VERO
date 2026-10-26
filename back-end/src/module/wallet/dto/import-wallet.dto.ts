import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SaveBillDto } from '../../bills/dto/save-bill.dto.js';
import { SaveDepositDto } from '../../deposits/dto/save-deposit.dto.js';
import { SaveExpenseDto } from '../../expenses/dto/save-expense.dto.js';

class ImportBillDto extends SaveBillDto {
  @IsString()
  id!: string;
}

class ImportDepositDto extends SaveDepositDto {
  @IsString()
  id!: string;
}

class ImportExpenseDto extends SaveExpenseDto {
  @IsString()
  id!: string;
}

class ImportPaymentDto {
  @IsString()
  billId!: string;

  @IsInt()
  @Min(1200)
  @Max(1600)
  year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsOptional()
  @IsString()
  paidAt?: string;
}

class ImportLogoDto {
  @IsString()
  billId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200_000)
  dataUrl!: string;
}

export class ImportWalletDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportBillDto)
  bills!: ImportBillDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportDepositDto)
  deposits!: ImportDepositDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportExpenseDto)
  expenses!: ImportExpenseDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPaymentDto)
  payments!: ImportPaymentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportLogoDto)
  logos?: ImportLogoDto[];
}
