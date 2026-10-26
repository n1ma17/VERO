import { BadRequestException, Injectable } from '@nestjs/common';
import { isIsoDate, isoToJalali, jalaliMonthFirstIso } from '../../common/money/calendar.js';
import { mapLedgerEntry, type LedgerRow } from '../../common/money/mappers.js';
import { indexToMonth, monthIndex } from '../../common/money/tehran-today.js';
import type { LedgerMonthDto, LedgerMonthPointDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';

const CHART_MONTHS = 6;

const JALALI_MONTH_NAMES = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
] as const;

type MonthTotalRow = {
  income: string | number;
  bills: string | number;
  expenses: string | number;
  net: string | number;
  closing_balance: string | number;
};

type ChartRow = {
  jalali_year: number;
  jalali_month: number;
  month_index: number;
  income: string | number;
  bills: string | number;
  expenses: string | number;
  closing_balance: string | number;
};

@Injectable()
export class LedgerService {
  constructor(private readonly pg: PgService) {}

  async getMonth(userId: string, isoDate: string): Promise<LedgerMonthDto> {
    if (!isIsoDate(isoDate)) {
      throw new BadRequestException('date must be a real Gregorian date');
    }
    const { year, month } = isoToJalali(isoDate);
    const index = monthIndex(year, month);
    const chartStart = index - (CHART_MONTHS - 1);

    const [totalsResult, openingResult, entriesResult, chartResult, chartOpeningResult] =
      await Promise.all([
        this.pg.query<MonthTotalRow>(
          `SELECT income, bills, expenses, net, closing_balance
             FROM v_month_totals
            WHERE user_id = $1 AND jalali_year = $2 AND jalali_month = $3`,
          [userId, year, month],
        ),
        this.pg.query<{ closing_balance: string | number }>(
          `SELECT closing_balance
             FROM v_month_totals
            WHERE user_id = $1 AND month_index < $2
            ORDER BY month_index DESC
            LIMIT 1`,
          [userId, index],
        ),
        this.pg.query<LedgerRow>(
          `SELECT id, kind, title, detail, amount, occurred_on, year, month, day,
                  status, installment_id, expense_id, category, balance
             FROM v_ledger_entries
            WHERE user_id = $1 AND counted_year = $2 AND counted_month = $3
            ORDER BY sort_key, id`,
          [userId, year, month],
        ),
        this.pg.query<ChartRow>(
          `SELECT jalali_year, jalali_month, month_index, income, bills, expenses, closing_balance
             FROM v_month_totals
            WHERE user_id = $1 AND month_index BETWEEN $2 AND $3`,
          [userId, chartStart, index],
        ),
        this.pg.query<{ closing_balance: string | number }>(
          `SELECT closing_balance
             FROM v_month_totals
            WHERE user_id = $1 AND month_index < $2
            ORDER BY month_index DESC
            LIMIT 1`,
          [userId, chartStart],
        ),
      ]);

    const totals = totalsResult.rows[0];
    const income = Number(totals?.income ?? 0);
    const bills = Number(totals?.bills ?? 0);
    const expenses = Number(totals?.expenses ?? 0);
    const openingBalance = Number(openingResult.rows[0]?.closing_balance ?? 0);
    const entries = entriesResult.rows.map(mapLedgerEntry);
    const monthNet = income - bills - expenses;

    const depositCount = entries.filter((entry) => entry.kind === 'deposit').length;
    const billEntries = entries.filter((entry) => entry.kind === 'bill');
    const expenseCount = entries.filter((entry) => entry.kind === 'expense').length;
    const paidBillsTotal = billEntries
      .filter((entry) => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      date: jalaliMonthFirstIso(year, month),
      monthIncome: income,
      monthBills: bills,
      monthExpenses: expenses,
      monthSpending: bills + expenses,
      monthNet,
      openingBalance,
      closingBalance: openingBalance + monthNet,
      entries,
      depositCount,
      billCount: billEntries.length,
      expenseCount,
      paidBillsTotal,
      unpaidBillsTotal: bills - paidBillsTotal,
      chartSeries: buildChartSeries(chartResult.rows, chartStart, chartOpeningResult.rows[0]),
    };
  }
}

function monthLabel(month: number): string {
  return JALALI_MONTH_NAMES[month - 1].slice(0, 3);
}

function buildChartSeries(
  rows: ChartRow[],
  chartStart: number,
  opening: { closing_balance: string | number } | undefined,
): LedgerMonthPointDto[] {
  const byIndex = new Map(rows.map((row) => [row.month_index, row]));
  let running = Number(opening?.closing_balance ?? 0);
  const points: LedgerMonthPointDto[] = [];

  for (let offset = 0; offset < CHART_MONTHS; offset++) {
    const monthIdx = chartStart + offset;
    const { year, month } = indexToMonth(monthIdx);
    const row = byIndex.get(monthIdx);
    if (row) running = Number(row.closing_balance);
    points.push({
      date: jalaliMonthFirstIso(year, month),
      label: monthLabel(month),
      income: Number(row?.income ?? 0),
      bills: Number(row?.bills ?? 0),
      expenses: Number(row?.expenses ?? 0),
      balance: running,
    });
  }

  return points;
}
