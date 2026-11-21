import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isIsoDate } from '../../common/money/calendar.js';
import { roundMoney } from '../../common/money/currency.js';
import { mapExpense, type ExpenseRow } from '../../common/money/mappers.js';
import type { ExpenseDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveExpenseDto } from './dto/save-expense.dto.js';

const COLUMNS = 'id, title, amount, currency, category, occurred_on, note, created_at';

const SELECT = `
  SELECT ${COLUMNS}
    FROM expenses
`;

@Injectable()
export class ExpensesService {
  constructor(private readonly pg: PgService) {}

  async list(userId: string): Promise<ExpenseDto[]> {
    const { rows } = await this.pg.query<ExpenseRow>(
      `${SELECT} WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(mapExpense);
  }

  async getById(userId: string, id: string): Promise<ExpenseDto> {
    const { rows } = await this.pg.query<ExpenseRow>(
      `${SELECT} WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Expense not found');
    return mapExpense(row);
  }

  async create(userId: string, dto: SaveExpenseDto): Promise<ExpenseDto> {
    if (!isIsoDate(dto.occurredOn)) {
      throw new BadRequestException('occurredOn must be a real Gregorian date');
    }
    const { rows } = await this.pg.query<ExpenseRow>(
      `INSERT INTO expenses
         (user_id, title, amount, currency, category, occurred_on, note)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7)
       RETURNING ${COLUMNS}`,
      [
        userId,
        dto.title.trim(),
        roundMoney(dto.amount, dto.currency),
        dto.currency,
        dto.category,
        dto.occurredOn,
        dto.note?.trim() || null,
      ],
    );
    return mapExpense(rows[0]);
  }

  async update(userId: string, id: string, dto: SaveExpenseDto): Promise<ExpenseDto> {
    if (!isIsoDate(dto.occurredOn)) {
      throw new BadRequestException('occurredOn must be a real Gregorian date');
    }
    const { rows } = await this.pg.query<ExpenseRow>(
      `UPDATE expenses
          SET title = $3,
              amount = $4,
              currency = $5,
              category = $6,
              occurred_on = $7::date,
              note = $8
        WHERE user_id = $1 AND id = $2
    RETURNING ${COLUMNS}`,
      [
        userId,
        id,
        dto.title.trim(),
        roundMoney(dto.amount, dto.currency),
        dto.currency,
        dto.category,
        dto.occurredOn,
        dto.note?.trim() || null,
      ],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Expense not found');
    return mapExpense(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { rowCount } = await this.pg.query(
      'DELETE FROM expenses WHERE user_id = $1 AND id = $2',
      [userId, id],
    );
    if (!rowCount) throw new NotFoundException('Expense not found');
  }
}
