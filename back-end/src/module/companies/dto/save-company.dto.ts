import { IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class SaveCompanyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  /** Base64 data URL, or `null` to clear the logo. Omit to leave unchanged on PATCH. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  logoUrl?: string | null;
}
