import { Matches } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class LedgerQueryDto {
  /** Gregorian ISO date; the statement is the Jalali month that contains it. */
  @Matches(ISO_DATE)
  date!: string;
}
