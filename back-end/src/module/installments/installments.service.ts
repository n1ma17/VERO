import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { mapInstallment, type InstallmentRow } from '../../common/money/mappers.js';
import type { InstallmentDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';

const SELECT = `
  SELECT id, bill_id, title, amount, due_year, due_month, due_day,
         due_date, paid_at, logo_key, status
    FROM v_installments
`;

function parseInstallmentId(id: string): { billId: string; year: number; month: number } {
  const separator = id.lastIndexOf('__');
  if (separator <= 0) {
    throw new BadRequestException('Invalid installment id');
  }
  const billId = id.slice(0, separator);
  const [yearPart, monthPart] = id.slice(separator + 2).split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!billId || !Number.isFinite(year) || !Number.isFinite(month)) {
    throw new BadRequestException('Invalid installment id');
  }
  return { billId, year, month };
}

@Injectable()
export class InstallmentsService {
  constructor(private readonly pg: PgService) {}

  async list(userId: string): Promise<InstallmentDto[]> {
    const { rows } = await this.pg.query<InstallmentRow>(
      `${SELECT} WHERE user_id = $1 ORDER BY due_date ASC, id ASC`,
      [userId],
    );
    return rows.map(mapInstallment);
  }

  async getById(userId: string, id: string): Promise<InstallmentDto> {
    const { rows } = await this.pg.query<InstallmentRow>(
      `${SELECT} WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Installment not found');
    return mapInstallment(row);
  }

  async setPaid(userId: string, id: string, paid: boolean): Promise<InstallmentDto> {
    const { billId, year, month } = parseInstallmentId(id);

    const { rows: owned } = await this.pg.query(
      'SELECT 1 FROM bills WHERE user_id = $1 AND id = $2',
      [userId, billId],
    );
    if (owned.length === 0) throw new NotFoundException('Installment not found');

    if (paid) {
      await this.pg.query(
        `INSERT INTO installment_payments (bill_id, jalali_year, jalali_month, paid_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (bill_id, jalali_year, jalali_month) DO NOTHING`,
        [billId, year, month],
      );
    } else {
      await this.pg.query(
        `DELETE FROM installment_payments
          WHERE bill_id = $1 AND jalali_year = $2 AND jalali_month = $3`,
        [billId, year, month],
      );
    }

    return this.getById(userId, id);
  }
}
