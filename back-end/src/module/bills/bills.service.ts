import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { durationFromSpan, isIsoDate } from '../../common/money/calendar.js';
import { roundMoney } from '../../common/money/currency.js';
import { mapBill, type BillRow } from '../../common/money/mappers.js';
import type { BillDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveBillDto } from './dto/save-bill.dto.js';

const BILL_SELECT = `
  SELECT
    b.id,
    b.title,
    b.amount,
    b.currency,
    b.start_on,
    b.end_on,
    b.due_day,
    b.created_at,
    b.company_id,
    c.name AS company_name,
    (cl.company_id IS NOT NULL) AS has_logo
  FROM bills AS b
  LEFT JOIN companies AS c ON c.id = b.company_id
  LEFT JOIN company_logos AS cl ON cl.company_id = c.id
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
    const companyId = await this.resolveCompanyId(userId, dto.companyId);
    const { rows } = await this.pg.query<{ id: string }>(
      `INSERT INTO bills
         (user_id, title, amount, currency, start_on, end_on, due_day, company_id)
       VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8)
       RETURNING id`,
      [
        userId,
        dto.title.trim(),
        roundMoney(dto.amount, dto.currency),
        dto.currency,
        dto.startOn,
        dto.endOn,
        dto.dueDay,
        companyId,
      ],
    );
    return this.getById(userId, rows[0].id);
  }

  async update(userId: string, id: string, dto: SaveBillDto): Promise<BillDto> {
    assertBillDates(dto);
    const companyId = await this.resolveCompanyId(userId, dto.companyId);
    const { rowCount } = await this.pg.query(
      `UPDATE bills
          SET title = $3,
              amount = $4,
              currency = $5,
              start_on = $6::date,
              end_on = $7::date,
              due_day = $8,
              company_id = $9
        WHERE user_id = $1 AND id = $2`,
      [
        userId,
        id,
        dto.title.trim(),
        roundMoney(dto.amount, dto.currency),
        dto.currency,
        dto.startOn,
        dto.endOn,
        dto.dueDay,
        companyId,
      ],
    );
    if (!rowCount) throw new NotFoundException('Bill not found');
    return this.getById(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { rowCount } = await this.pg.query(
      'DELETE FROM bills WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (!rowCount) throw new NotFoundException('Bill not found');
  }

  /** `null` / omitted → Others. Otherwise must belong to this user. */
  private async resolveCompanyId(
    userId: string,
    companyId: string | null | undefined,
  ): Promise<string | null> {
    if (companyId === undefined || companyId === null || companyId === '') {
      return null;
    }
    const { rowCount } = await this.pg.query(
      'SELECT 1 FROM companies WHERE user_id = $1 AND id = $2',
      [userId, companyId],
    );
    if (!rowCount) throw new BadRequestException('Company not found');
    return companyId;
  }
}
