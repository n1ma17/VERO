import { Injectable } from '@nestjs/common';
import { mapLedgerEntry, type LedgerRow } from '../../common/money/mappers.js';
import { monthIndex } from '../../common/money/tehran-today.js';
import type { LedgerEntryDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';

type MonthTotalRow = {
  income: string | number;
  bills: string | number;
  expenses: string | number;
  net: string | number;
  closing_balance: string | number;
};

@Injectable()
export class LedgerService {
  constructor(private readonly pg: PgService) {}

  async getMonth(userId: string, year: number, month: number) {
    const index = monthIndex(year, month);

    const [totalsResult, openingResult, entriesResult] = await Promise.all([
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
        `SELECT id, kind, title, detail, amount, year, month, day,
                status, installment_id, expense_id, category, balance
           FROM v_ledger_entries
          WHERE user_id = $1 AND counted_year = $2 AND counted_month = $3
          ORDER BY sort_key, id`,
        [userId, year, month],
      ),
    ]);

    const totals = totalsResult.rows[0];
    const income = Number(totals?.income ?? 0);
    const bills = Number(totals?.bills ?? 0);
    const expenses = Number(totals?.expenses ?? 0);
    const openingBalance = Number(openingResult.rows[0]?.closing_balance ?? 0);
    const entries: LedgerEntryDto[] = entriesResult.rows.map(mapLedgerEntry);

    return {
      year,
      month,
      monthIncome: income,
      monthBills: bills,
      monthExpenses: expenses,
      monthSpending: bills + expenses,
      monthNet: income - bills - expenses,
      openingBalance,
      closingBalance: openingBalance + (income - bills - expenses),
      entries,
    };
  }
}
