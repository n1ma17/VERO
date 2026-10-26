import type { PoolClient } from 'pg';
import { parseLogoDataUrl } from '../../src/common/money/logo.js';
import type { BackupSnapshot } from './backup-xlsx.js';

async function upsertLogo(
  client: PoolClient,
  billId: string,
  dataUrl: string,
): Promise<void> {
  try {
    const logo = parseLogoDataUrl(dataUrl);
    await client.query(
      `INSERT INTO bill_logos (bill_id, media_type, bytes)
       VALUES ($1, $2, $3)
       ON CONFLICT (bill_id) DO UPDATE
          SET media_type = EXCLUDED.media_type,
              bytes = EXCLUDED.bytes`,
      [billId, logo.mediaType, logo.bytes],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Skipped logo for bill ${billId}: ${message}`);
  }
}

/**
 * Replaces all money rows for `userId` with the backup snapshot (same rules as
 * `WalletService.importSnapshot`).
 */
export async function importWalletSnapshot(
  client: PoolClient,
  userId: string,
  snapshot: BackupSnapshot,
): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM bank_deposits WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM bills WHERE user_id = $1', [userId]);

    for (const bill of snapshot.bills) {
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
    }

    for (const logo of snapshot.logos) {
      await upsertLogo(client, logo.billId, logo.dataUrl);
    }

    for (const payment of snapshot.payments) {
      await client.query(
        `INSERT INTO installment_payments (bill_id, jalali_year, jalali_month, paid_at)
         VALUES ($1, $2, $3, $4::timestamptz)`,
        [payment.billId, payment.year, payment.month, payment.paidAt],
      );
    }

    for (const deposit of snapshot.deposits) {
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

    for (const expense of snapshot.expenses) {
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

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
