import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { durationFromSpan, isIsoDate } from '../../common/money/calendar.js';
import { upsertBillLogo } from '../../common/money/logo.js';
import { mapBill, type BillRow } from '../../common/money/mappers.js';
import type { BillDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveBillDto } from './dto/save-bill.dto.js';

const BILL_SELECT = `
  SELECT
    b.id,
    b.title,
    b.amount,
    b.start_on,
    b.end_on,
    b.due_day,
    b.created_at,
    (l.bill_id IS NOT NULL) AS has_logo
  FROM bills AS b
  LEFT JOIN bill_logos AS l ON l.bill_id = b.id
`;

function assertBillDates(dto: SaveBillDto): void {
  if (!isIsoDate(dto.startOn) || !isIsoDate(dto.endOn)) {
    throw new BadRequestException('startOn and endOn must be real Gregorian dates');
  }
  if (dto.endOn < dto.startOn) {
    throw new BadRequestException('endOn must be on or after startOn');
  }
  const months = durationFromSpan(dto.startOn, dto.endOn);
  if (months < 1 || months > 60) {
    throw new BadRequestException('Bill span must be 1–60 months');
  }
}

@Injectable()
export class BillsService {
  constructor(private readonly pg: PgService) {}

  async list(userId: string): Promise<BillDto[]> {
    const { rows } = await this.pg.query<BillRow>(
      `${BILL_SELECT}
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId],
    );
    return rows.map(mapBill);
  }

  async getById(userId: string, id: string): Promise<BillDto> {
    const { rows } = await this.pg.query<BillRow>(
      `${BILL_SELECT}
       WHERE b.user_id = $1 AND b.id = $2`,
      [userId, id],
    );
    const bill = rows[0];
    if (!bill) throw new NotFoundException('Bill not found');
    return mapBill(bill);
  }

  async create(userId: string, dto: SaveBillDto): Promise<BillDto> {
    assertBillDates(dto);
    const { rows } = await this.pg.query<{ id: string }>(
      `INSERT INTO bills
         (user_id, title, amount, start_on, end_on, due_day)
       VALUES ($1, $2, $3, $4::date, $5::date, $6)
       RETURNING id`,
      [userId, dto.title.trim(), dto.amount, dto.startOn, dto.endOn, dto.dueDay],
    );
    const id = rows[0].id;
    if (dto.logoUrl) {
      await upsertBillLogo(this.pg.query.bind(this.pg), id, dto.logoUrl);
    }
    return this.getById(userId, id);
  }

  async update(userId: string, id: string, dto: SaveBillDto): Promise<BillDto> {
    assertBillDates(dto);
    const { rowCount } = await this.pg.query(
      `UPDATE bills
          SET title = $3,
              amount = $4,
              start_on = $5::date,
              end_on = $6::date,
              due_day = $7
        WHERE user_id = $1 AND id = $2`,
      [userId, id, dto.title.trim(), dto.amount, dto.startOn, dto.endOn, dto.dueDay],
    );
    if (!rowCount) throw new NotFoundException('Bill not found');

    if (dto.logoUrl) {
      await upsertBillLogo(this.pg.query.bind(this.pg), id, dto.logoUrl);
    } else if (dto.logoUrl === null) {
      await this.pg.query('DELETE FROM bill_logos WHERE bill_id = $1', [id]);
    }

    return this.getById(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { rowCount } = await this.pg.query(
      'DELETE FROM bills WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (!rowCount) throw new NotFoundException('Bill not found');
  }

  async getLogo(
    userId: string,
    id: string,
  ): Promise<{ mediaType: string; bytes: Buffer }> {
    const { rows } = await this.pg.query<{ media_type: string; bytes: Buffer }>(
      `SELECT l.media_type, l.bytes
         FROM bill_logos AS l
         JOIN bills AS b ON b.id = l.bill_id
        WHERE b.user_id = $1 AND b.id = $2`,
      [userId, id],
    );
    const logo = rows[0];
    if (!logo) throw new NotFoundException('Logo not found');
    return { mediaType: logo.media_type, bytes: logo.bytes };
  }
}
