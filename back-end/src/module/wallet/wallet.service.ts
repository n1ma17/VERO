import { Injectable } from '@nestjs/common';
import { upsertBillLogo } from '../../common/money/logo.js';
import type { WalletSnapshot } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import { BillsService } from '../bills/bills.service.js';
import { DepositsService } from '../deposits/deposits.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { InstallmentsService } from '../installments/installments.service.js';
import type { ImportWalletDto } from './dto/import-wallet.dto.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly pg: PgService,
    private readonly bills: BillsService,
    private readonly deposits: DepositsService,
    private readonly expenses: ExpensesService,
    private readonly installments: InstallmentsService,
  ) {}

  async snapshot(userId: string): Promise<WalletSnapshot> {
    const [bills, deposits, expenses, installments] = await Promise.all([
      this.bills.list(userId),
      this.deposits.list(userId),
      this.expenses.list(userId),
      this.installments.list(userId),
    ]);
    return { bills, deposits, expenses, installments };
  }

  async importSnapshot(userId: string, dto: ImportWalletDto): Promise<WalletSnapshot> {
    await this.pg.transaction(async (client) => {
      await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM bank_deposits WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM bills WHERE user_id = $1', [userId]);

      for (const bill of dto.bills) {
        await client.query(
          `INSERT INTO bills
             (id, user_id, title, amount, start_year, start_month, due_day, duration_months)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            bill.id,
            userId,
            bill.title.trim(),
            bill.amount,
            bill.startYear,
            bill.startMonth,
            bill.dueDay,
            bill.durationMonths,
          ],
        );
        if (bill.logoUrl) {
          await upsertBillLogo(client.query.bind(client), bill.id, bill.logoUrl);
        }
      }

      for (const logo of dto.logos ?? []) {
        await upsertBillLogo(client.query.bind(client), logo.billId, logo.dataUrl);
      }

      for (const payment of dto.payments) {
        await client.query(
          `INSERT INTO installment_payments (bill_id, jalali_year, jalali_month, paid_at)
           VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()))`,
          [payment.billId, payment.year, payment.month, payment.paidAt ?? null],
        );
      }

      for (const deposit of dto.deposits) {
        await client.query(
          `INSERT INTO bank_deposits
             (id, user_id, amount, jalali_year, jalali_month, jalali_day, booked_year, booked_month, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            deposit.id,
            userId,
            deposit.amount,
            deposit.jalaliYear,
            deposit.jalaliMonth,
            deposit.jalaliDay,
            deposit.bookedYear,
            deposit.bookedMonth,
            deposit.note?.trim() || null,
          ],
        );
      }

      for (const expense of dto.expenses) {
        await client.query(
          `INSERT INTO expenses
             (id, user_id, title, amount, category, jalali_year, jalali_month, jalali_day, note)
           VALUES ($1, $2, $3, $4, $5::expense_category, $6, $7, $8, $9)`,
          [
            expense.id,
            userId,
            expense.title.trim(),
            expense.amount,
            expense.category,
            expense.jalaliYear,
            expense.jalaliMonth,
            expense.jalaliDay,
            expense.note?.trim() || null,
          ],
        );
      }
    });

    return this.snapshot(userId);
  }
}
