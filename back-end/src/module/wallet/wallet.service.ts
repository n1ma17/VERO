import { Injectable } from '@nestjs/common';
import { roundMoney } from '../../common/money/currency.js';
import { parseLogoDataUrl } from '../../common/money/logo.js';
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
      await client.query('DELETE FROM companies WHERE user_id = $1', [userId]);

      const knownCompanyIds = new Set<string>();

      for (const company of dto.companies ?? []) {
        await client.query(
          `INSERT INTO companies (id, user_id, name)
           VALUES ($1, $2, $3)`,
          [company.id, userId, company.name.trim()],
        );
        knownCompanyIds.add(company.id);
        if (company.logoUrl) {
          const logo = parseLogoDataUrl(company.logoUrl);
          await client.query(
            `INSERT INTO company_logos (company_id, media_type, bytes)
             VALUES ($1, $2, $3)`,
            [company.id, logo.mediaType, logo.bytes],
          );
        }
      }

      const logosByBill = new Map<string, string>();
      for (const logo of dto.logos ?? []) {
        logosByBill.set(logo.billId, logo.dataUrl);
      }

      for (const bill of dto.bills) {
        let companyId: string | null = bill.companyId ?? null;
        if (companyId && !knownCompanyIds.has(companyId)) {
          companyId = null;
        }

        const logoUrl = logosByBill.get(bill.id) ?? bill.logoUrl ?? null;

        if (!companyId && logoUrl) {
          const legacyName = bill.title.trim().slice(0, 80);
          const { rows: existing } = await client.query<{ id: string }>(
            `SELECT id FROM companies
              WHERE user_id = $1 AND lower(btrim(name)) = lower(btrim($2))
              LIMIT 1`,
            [userId, legacyName],
          );
          if (existing[0]) {
            companyId = existing[0].id;
          } else {
            const { rows } = await client.query<{ id: string }>(
              `INSERT INTO companies (user_id, name)
               VALUES ($1, $2)
               RETURNING id`,
              [userId, legacyName],
            );
            companyId = rows[0].id;
          }
          knownCompanyIds.add(companyId);
          const logo = parseLogoDataUrl(logoUrl);
          await client.query(
            `INSERT INTO company_logos (company_id, media_type, bytes)
             VALUES ($1, $2, $3)
             ON CONFLICT (company_id) DO UPDATE
                SET media_type = EXCLUDED.media_type,
                    bytes = EXCLUDED.bytes`,
            [companyId, logo.mediaType, logo.bytes],
          );
        }

        await client.query(
          `INSERT INTO bills
             (id, user_id, title, amount, currency, start_on, end_on, due_day, company_id)
           VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9)`,
          [
            bill.id,
            userId,
            bill.title.trim(),
            roundMoney(bill.amount, bill.currency),
            bill.currency,
            bill.startOn,
            bill.endOn,
            bill.dueDay,
            companyId,
          ],
        );
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
             (id, user_id, amount, currency, arrived_on, booked_on, note)
           VALUES ($1, $2, $3, $4, $5::date, $6::date, $7)`,
          [
            deposit.id,
            userId,
            roundMoney(deposit.amount, deposit.currency),
            deposit.currency,
            deposit.arrivedOn,
            deposit.bookedOn,
            deposit.note?.trim() || null,
          ],
        );
      }

      for (const expense of dto.expenses) {
        await client.query(
          `INSERT INTO expenses
             (id, user_id, title, amount, currency, category, occurred_on, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)`,
          [
            expense.id,
            userId,
            expense.title.trim(),
            roundMoney(expense.amount, expense.currency),
            expense.currency,
            expense.category,
            expense.occurredOn,
            expense.note?.trim() || null,
          ],
        );
      }
    });
  }
}
