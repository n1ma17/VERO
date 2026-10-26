import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class LedgerQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1200)
  @Max(1600)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
