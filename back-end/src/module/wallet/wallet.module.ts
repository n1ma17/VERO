import { Module } from '@nestjs/common';
import { BillsModule } from '../bills/bills.module.js';
import { DepositsModule } from '../deposits/deposits.module.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { InstallmentsModule } from '../installments/installments.module.js';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';

@Module({
  imports: [BillsModule, DepositsModule, ExpensesModule, InstallmentsModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
