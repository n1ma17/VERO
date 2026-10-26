import { IsBoolean } from 'class-validator';

export class SetPaidDto {
  @IsBoolean()
  paid!: boolean;
}
