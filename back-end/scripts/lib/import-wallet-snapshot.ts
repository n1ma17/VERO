import type { PoolClient } from 'pg';
import { billEndIso, jalaliMonthFirstIso, jalaliToIso } from '../../src/common/money/calendar.js';
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
 * `WalletService.importSnapshot`). Excel backups still use Jalali numbers.
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
      const startOn = jalaliToIso(bill.startYear, bill.startMonth, bill.dueDay);
      const endOn = billEndIso(
        bill.startYear,
        bill.startMonth,
        bill.dueDay,
        bill.durationMonths,
      );
      await client.query(
        `INSERT INTO bills
           (id, user_id, title, amount, start_on, end_on, due_day)
         VALUES ($1, $2, $3, $4, $5::date, $6::date, $7)`,
        [bill.id, userId, bill.title.trim(), bill.amount, startOn, endOn, bill.dueDay],
      );
    }

    for (const logo of snapshot.logos) {
      await upsertLogo(client, logo.billId, logo.dataUrl);
    }

    for (const payment of snapshot.payments) {
      const bill = snapshot.bills.find((item) => item.id === payment.billId);
      const dueDay = bill?.dueDay ?? 1;
      const dueOn = jalaliToIso(payment.year, payment.month, dueDay);
      await client.query(
        `INSERT INTO installment_payments (bill_id, due_on, paid_at)
         VALUES ($1, $2::date, $3::timestamptz)`,
        [payment.billId, dueOn, payment.paidAt],
      );
    }

    for (const deposit of snapshot.deposits) {
      await client.query(
        `INSERT INTO bank_deposits
           (id, user_id, amount, arrived_on, booked_on, note)
         VALUES ($1, $2, $3, $4::date, $5::date, $6)`,
        [
          deposit.id,
          userId,
          deposit.amount,
          jalaliToIso(deposit.jalaliYear, deposit.jalaliMonth, deposit.jalaliDay),
          jalaliMonthFirstIso(deposit.bookedYear, deposit.bookedMonth),
          deposit.note?.trim() || null,
        ],
      );
    }

    for (const expense of snapshot.expenses) {
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
          jalaliToIso(expense.jalaliYear, expense.jalaliMonth, expense.jalaliDay),
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
