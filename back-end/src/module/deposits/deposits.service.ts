import { Injectable, NotFoundException } from '@nestjs/common';
import { mapDeposit, type DepositRow } from '../../common/money/mappers.js';
import type { BankDepositDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveDepositDto } from './dto/save-deposit.dto.js';

const SELECT = `
  SELECT id, amount, jalali_year, jalali_month, jalali_day,
         booked_year, booked_month, note, created_at
    FROM bank_deposits
`;

@Injectable()
export class DepositsService {
  constructor(private readonly pg: PgService) {}

  async list(userId: string): Promise<BankDepositDto[]> {
    const { rows } = await this.pg.query<DepositRow>(
      `${SELECT} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapDeposit);
  }

  async create(userId: string, dto: SaveDepositDto): Promise<BankDepositDto> {
    const { rows } = await this.pg.query<DepositRow>(
      `INSERT INTO bank_deposits
         (user_id, amount, jalali_year, jalali_month, jalali_day, booked_year, booked_month, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, amount, jalali_year, jalali_month, jalali_day,
                 booked_year, booked_month, note, created_at`,
      [
        userId,
        dto.amount,
        dto.jalaliYear,
        dto.jalaliMonth,
        dto.jalaliDay,
        dto.bookedYear,
        dto.bookedMonth,
        dto.note?.trim() || null,
      ],
    );
    return mapDeposit(rows[0]);
  }

  async update(userId: string, id: string, dto: SaveDepositDto): Promise<BankDepositDto> {
    const { rows } = await this.pg.query<DepositRow>(
      `UPDATE bank_deposits
          SET amount = $3,
              jalali_year = $4,
              jalali_month = $5,
              jalali_day = $6,
              booked_year = $7,
              booked_month = $8,
              note = $9
        WHERE user_id = $1 AND id = $2
    RETURNING id, amount, jalali_year, jalali_month, jalali_day,
              booked_year, booked_month, note, created_at`,
      [
        userId,
        id,
        dto.amount,
        dto.jalaliYear,
        dto.jalaliMonth,
        dto.jalaliDay,
        dto.bookedYear,
        dto.bookedMonth,
        dto.note?.trim() || null,
      ],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Deposit not found');
    return mapDeposit(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { rowCount } = await this.pg.query(
      'DELETE FROM bank_deposits WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (!rowCount) throw new NotFoundException('Deposit not found');
  }
}
