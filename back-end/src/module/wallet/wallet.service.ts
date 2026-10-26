import { Injectable } from '@nestjs/common';
import { upsertBillLogo } from '../../common/money/logo.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { ImportWalletDto } from './dto/import-wallet.dto.js';

@Injectable()
export class WalletService {
  constructor(private readonly pg: PgService) {}

  async importSnapshot(userId: string, dto: ImportWalletDto): Promise<void> {
    await this.pg.transaction(async (client) => {
      await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM bank_deposits WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM bills WHERE user_id = $1', [userId]);

      for (const bill of dto.bills) {
        await client.query(
          `INSERT INTO bills
             (id, user_id, title, amount, start_on, end_on, due_day)
           VALUES ($1, $2, $3, $4, $5::date, $6::date, $7)`,
          [
            bill.id,
            userId,
            bill.title.trim(),
            bill.amount,
            bill.startOn,
            bill.endOn,
            bill.dueDay,
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
          `INSERT INTO installment_payments (bill_id, due_on, paid_at)
           VALUES ($1, $2::date, COALESCE($3::timestamptz, now()))`,
          [payment.billId, payment.dueOn, payment.paidAt ?? null],
        );
      }

      for (const deposit of dto.deposits) {
        await client.query(
          `INSERT INTO bank_deposits
             (id, user_id, amount, arrived_on, booked_on, note)
           VALUES ($1, $2, $3, $4::date, $5::date, $6)`,
          [
            deposit.id,
            userId,
            deposit.amount,
            deposit.arrivedOn,
            deposit.bookedOn,
            deposit.note?.trim() || null,
          ],
        );
      }

      for (const expense of dto.expenses) {
        await client.query(
          `INSERT INTO expenses
             (id, user_id, title, amount, category, occurred_on, note)
           VALUES ($1, $2, $3, $4, $5::expense_category, $6::date, $7)`,
          [
            expense.id,
            userId,
            expense.title.trim(),
            expense.amount,
            expense.category,
            expense.occurredOn,
            expense.note?.trim() || null,
          ],
        );
      }
    });
  }
}
