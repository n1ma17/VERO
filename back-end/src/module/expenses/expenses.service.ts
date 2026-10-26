import { Injectable, NotFoundException } from '@nestjs/common';
import { mapExpense, type ExpenseRow } from '../../common/money/mappers.js';
import type { ExpenseDto } from '../../common/money/types.js';
import { PgService } from '../../lib/database/pg.service.js';
import type { SaveExpenseDto } from './dto/save-expense.dto.js';

const SELECT = `
  SELECT id, title, amount, category, jalali_year, jalali_month, jalali_day, note, created_at
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
    const { rows } = await this.pg.query<ExpenseRow>(
      `INSERT INTO expenses
         (user_id, title, amount, category, jalali_year, jalali_month, jalali_day, note)
       VALUES ($1, $2, $3, $4::expense_category, $5, $6, $7, $8)
       RETURNING id, title, amount, category, jalali_year, jalali_month, jalali_day, note, created_at`,
      [
        userId,
        dto.title.trim(),
        dto.amount,
        dto.category,
        dto.jalaliYear,
        dto.jalaliMonth,
        dto.jalaliDay,
        dto.note?.trim() || null,
      ],
    );
    return mapExpense(rows[0]);
  }

  async update(userId: string, id: string, dto: SaveExpenseDto): Promise<ExpenseDto> {
    const { rows } = await this.pg.query<ExpenseRow>(
      `UPDATE expenses
          SET title = $3,
              amount = $4,
              category = $5::expense_category,
              jalali_year = $6,
              jalali_month = $7,
              jalali_day = $8,
              note = $9
        WHERE user_id = $1 AND id = $2
    RETURNING id, title, amount, category, jalali_year, jalali_month, jalali_day, note, created_at`,
      [
        userId,
        id,
        dto.title.trim(),
        dto.amount,
        dto.category,
        dto.jalaliYear,
        dto.jalaliMonth,
        dto.jalaliDay,
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
