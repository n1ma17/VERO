import { Module } from '@nestjs/common';
import { BillsModule } from '../bills/bills.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { InstallmentsModule } from '../installments/installments.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [BillsModule, DepositsModule, ExpensesModule, InstallmentsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
