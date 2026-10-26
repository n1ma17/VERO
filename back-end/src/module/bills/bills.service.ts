import { Injectable, NotFoundException } from '@nestjs/common';
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
    b.start_year,
    b.start_month,
    b.due_day,
    b.duration_months,
    b.created_at,
    (l.bill_id IS NOT NULL) AS has_logo
  FROM bills AS b
  LEFT JOIN bill_logos AS l ON l.bill_id = b.id
`;

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
    const { rows } = await this.pg.query<{ id: string }>(
      `INSERT INTO bills
         (user_id, title, amount, start_year, start_month, due_day, duration_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        dto.title.trim(),
        dto.amount,
        dto.startYear,
        dto.startMonth,
        dto.dueDay,
        dto.durationMonths,
      ],
    );
    const id = rows[0].id;
    if (dto.logoUrl) {
      await upsertBillLogo(this.pg.query.bind(this.pg), id, dto.logoUrl);
    }
    return this.getById(userId, id);
  }

  async update(userId: string, id: string, dto: SaveBillDto): Promise<BillDto> {
    const { rowCount } = await this.pg.query(
      `UPDATE bills
          SET title = $3,
              amount = $4,
              start_year = $5,
              start_month = $6,
              due_day = $7,
              duration_months = $8
        WHERE user_id = $1 AND id = $2`,
      [
        userId,
        id,
        dto.title.trim(),
        dto.amount,
        dto.startYear,
        dto.startMonth,
        dto.dueDay,
        dto.durationMonths,
      ],
    );
    if (!rowCount) throw new NotFoundException('Bill not found');

    if (dto.logoUrl) {
      await upsertBillLogo(this.pg.query.bind(this.pg), id, dto.logoUrl);
    } else if (dto.logoUrl === null) {
      await this.pg.query('DELETE FROM bill_logos WHERE bill_id = $1', [id]);
    }

    return this.getById(userId, id);
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
