import { BadRequestException, Injectable } from '@nestjs/common';
import { isIsoDate, isoToJalali, jalaliMonthFirstIso } from '../../common/money/calendar.js';
import {
  fromUsd,
  isCurrency,
  roundMoney,
  type Currency,
  type FxRates,
} from '../../common/money/currency.js';
import {
  ledgerRowDate,
  mapLedgerStatus,
  type LedgerRow,
} from '../../common/money/mappers.js';
import { indexToMonth, monthIndex } from '../../common/money/tehran-today.js';
import type {
  LedgerEntryDto,
  LedgerMonthDto,
  LedgerMonthPointDto,
} from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import { FxService } from '../../lib/fx/fx.service.js';

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

/** All money columns are USD (see `v_month_totals`). */
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

type ToDisplay = (usd: string | number | null | undefined) => number;

@Injectable()
export class LedgerService {
  constructor(
    private readonly pg: PgService,
    private readonly fx: FxService,
  ) {}

  async getMonth(userId: string, isoDate: string): Promise<LedgerMonthDto> {
    if (!isIsoDate(isoDate)) {
      throw new BadRequestException('date must be a real Gregorian date');
    }
    const { year, month } = isoToJalali(isoDate);
    const index = monthIndex(year, month);
    const chartStart = index - (CHART_MONTHS - 1);

    await this.fx.ensureFresh();

    const [
      currencyResult,
      rates,
      totalsResult,
      openingResult,
      entriesResult,
      chartResult,
      chartOpeningResult,
      unpaidResult,
    ] = await Promise.all([
      this.pg.query<{ currency: string }>('SELECT currency FROM users WHERE id = $1', [userId]),
      this.fx.getUserRates(userId),
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
        `SELECT id, kind, title, detail, amount, currency, amount_usd, occurred_on,
                year, month, day, status, installment_id, expense_id, category, balance_usd
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
      this.pg.query<{ total: string | number }>(
        `SELECT coalesce(sum(amount_usd), 0) AS total
           FROM v_installments
          WHERE user_id = $1
            AND due_year = $2
            AND due_month = $3
            AND paid_at IS NULL`,
        [userId, year, month],
      ),
    ]);

    const storedCurrency = currencyResult.rows[0]?.currency;
    const currency: Currency = isCurrency(storedCurrency) ? storedCurrency : 'IRR';
    const toDisplay = displayConverter(currency, rates);

    const totals = totalsResult.rows[0];
    const income = toDisplay(totals?.income);
    const bills = toDisplay(totals?.bills);
    const expenses = toDisplay(totals?.expenses);
    const openingBalance = toDisplay(openingResult.rows[0]?.closing_balance);
    const entries = entriesResult.rows.map((row) => mapEntry(row, toDisplay));
    const round = (value: number) => roundMoney(value, currency);
    const monthNet = round(income - bills - expenses);

    const depositCount = entries.filter((entry) => entry.kind === 'deposit').length;
    const billEntries = entries.filter((entry) => entry.kind === 'bill');
    const expenseCount = entries.filter((entry) => entry.kind === 'expense').length;
    const paidBillsTotal = toDisplay(
      entriesResult.rows
        .filter((row) => row.kind === 'bill' && row.status === 'paid')
        .reduce((sum, row) => sum + Number(row.amount_usd), 0),
    );
    const unpaidBillsTotal = toDisplay(unpaidResult.rows[0]?.total);

    return {
      date: jalaliMonthFirstIso(year, month),
      currency,
      monthIncome: income,
      monthBills: bills,
      monthExpenses: expenses,
      monthSpending: round(bills + expenses),
      monthNet,
      openingBalance,
      closingBalance: round(openingBalance + monthNet),
      entries,
      depositCount,
      billCount: billEntries.length,
      expenseCount,
      paidBillsTotal,
      unpaidBillsTotal,
      chartSeries: buildChartSeries(
        chartResult.rows,
        chartStart,
        chartOpeningResult.rows[0],
        toDisplay,
      ),
    };
  }
}

function displayConverter(currency: Currency, rates: FxRates): ToDisplay {
  return (usd) => fromUsd(Number(usd ?? 0), currency, rates);
}

function mapEntry(row: LedgerRow, toDisplay: ToDisplay): LedgerEntryDto {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    amount: toDisplay(row.amount_usd),
    originalAmount: Number(row.amount),
    originalCurrency: row.currency,
    date: ledgerRowDate(row),
    status: mapLedgerStatus(row.status),
    installmentId: row.installment_id,
    expenseId: row.expense_id,
    category: row.category,
    balance: toDisplay(row.balance_usd),
  };
}

function monthLabel(month: number): string {
  return JALALI_MONTH_NAMES[month - 1].slice(0, 3);
}

function buildChartSeries(
  rows: ChartRow[],
  chartStart: number,
  opening: { closing_balance: string | number } | undefined,
  toDisplay: ToDisplay,
): LedgerMonthPointDto[] {
  const byIndex = new Map(rows.map((row) => [row.month_index, row]));
  let running = toDisplay(opening?.closing_balance);
  const points: LedgerMonthPointDto[] = [];

  for (let offset = 0; offset < CHART_MONTHS; offset++) {
    const monthIdx = chartStart + offset;
    const { year, month } = indexToMonth(monthIdx);
    const row = byIndex.get(monthIdx);
    if (row) running = toDisplay(row.closing_balance);
    points.push({
      date: jalaliMonthFirstIso(year, month),
      label: monthLabel(month),
      income: toDisplay(row?.income),
      bills: toDisplay(row?.bills),
      expenses: toDisplay(row?.expenses),
      balance: running,
    });
  }

  return points;
}
