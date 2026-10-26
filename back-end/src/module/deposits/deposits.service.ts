import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isIsoDate } from '../../common/money/calendar.js';
import { mapDeposit, type DepositRow } from '../../common/money/mappers.js';
import type { BankDepositDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveDepositDto } from './dto/save-deposit.dto.js';

const SELECT = `
  SELECT id, amount, arrived_on, booked_on, note, created_at
    FROM bank_deposits
`;

function assertDates(dto: SaveDepositDto): void {
  if (!isIsoDate(dto.arrivedOn) || !isIsoDate(dto.bookedOn)) {
    throw new BadRequestException('arrivedOn and bookedOn must be real Gregorian dates');
  }
}

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
    assertDates(dto);
    const { rows } = await this.pg.query<DepositRow>(
      `INSERT INTO bank_deposits
         (user_id, amount, arrived_on, booked_on, note)
       VALUES ($1, $2, $3::date, $4::date, $5)
       RETURNING id, amount, arrived_on, booked_on, note, created_at`,
      [userId, dto.amount, dto.arrivedOn, dto.bookedOn, dto.note?.trim() || null],
    );
    return mapDeposit(rows[0]);
  }

  async update(userId: string, id: string, dto: SaveDepositDto): Promise<BankDepositDto> {
    assertDates(dto);
    const { rows } = await this.pg.query<DepositRow>(
      `UPDATE bank_deposits
          SET amount = $3,
              arrived_on = $4::date,
              booked_on = $5::date,
              note = $6
        WHERE user_id = $1 AND id = $2
    RETURNING id, amount, arrived_on, booked_on, note, created_at`,
      [userId, id, dto.amount, dto.arrivedOn, dto.bookedOn, dto.note?.trim() || null],
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
