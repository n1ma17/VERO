import { Injectable } from '@nestjs/common';
import { BillsService } from '../bills/bills.service.js';
import { DepositsService } from '../deposits/deposits.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { InstallmentsService } from '../installments/installments.service.js';
import { tehranJalaliToday } from '../../common/money/tehran-today.js';
import { PgService } from '../../lib/database/pg.service.js';

/**
 * Dashboard payload is assembled from the same collections the Vue app
 * already hydrates. Keeping this endpoint means a client can skip four
 * round-trips when it only needs the overview.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly pg: PgService,
    private readonly bills: BillsService,
    private readonly deposits: DepositsService,
    private readonly expenses: ExpensesService,
    private readonly installments: InstallmentsService,
  ) {}

  async getOverview(userId: string) {
    const [today, bills, deposits, expenses, installments] = await Promise.all([
      tehranJalaliToday(this.pg),
      this.bills.list(userId),
      this.deposits.list(userId),
      this.expenses.list(userId),
      this.installments.list(userId),
    ]);

    return { today, bills, deposits, expenses, installments };
  }
}
