import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SaveBillDto } from '../../bills/dto/save-bill.dto.js';
import { SaveDepositDto } from '../../deposits/dto/save-deposit.dto.js';
import { SaveExpenseDto } from '../../expenses/dto/save-expense.dto.js';

class ImportCompanyDto {
  @IsString()
  id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  logoUrl?: string | null;
}

class ImportBillDto extends SaveBillDto {
  @IsString()
  id!: string;

  /** Legacy Excel backup logos — turned into a company on import. */
  @IsOptional()
  @IsString()
  logoUrl?: string | null;
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

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueOn!: string;

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
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCompanyDto)
  companies?: ImportCompanyDto[];

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

  /** Legacy: logo keyed by bill id. Prefer `companies[].logoUrl`. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportLogoDto)
  logos?: ImportLogoDto[];
}
