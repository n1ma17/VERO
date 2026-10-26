import { toJalaali } from 'jalaali-js';
import type { PgService } from '../../lib/database/pg.service.js';

export type JalaliDate = {
  year: number;
  month: number;
  day: number;
};

export async function tehranJalaliToday(pg: PgService): Promise<JalaliDate> {
  const { rows } = await pg.query<{ gy: number; gm: number; gd: number }>(
    `SELECT
       EXTRACT(YEAR FROM timezone('Asia/Tehran', now()))::int AS gy,
       EXTRACT(MONTH FROM timezone('Asia/Tehran', now()))::int AS gm,
       EXTRACT(DAY FROM timezone('Asia/Tehran', now()))::int AS gd`,
  );
  const row = rows[0];
  const { jy, jm, jd } = toJalaali(row.gy, row.gm, row.gd);
  return { year: jy, month: jm, day: jd };
}

export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export function indexToMonth(index: number): { year: number; month: number } {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month };
}
