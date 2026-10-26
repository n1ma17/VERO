import { ArcjetGuard } from '@arcjet/nest';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetProtectionModule } from './lib/arcjet/arcjet.module.js';
import { AppAuthModule } from './lib/auth/auth.module.js';
import { validateAuthEnv } from './lib/auth/validate-auth-env.js';
import { PgModule } from './lib/database/pg.module.js';
import { BillsModule } from './module/bills/bills.module.js';
import { DashboardModule } from './module/dashboard/dashboard.module.js';
import { DepositsModule } from './module/deposits/deposits.module.js';
import { ExpensesModule } from './module/expenses/expenses.module.js';
import { InstallmentsModule } from './module/installments/installments.module.js';
import { LedgerModule } from './module/ledger/ledger.module.js';
import { UsersModule } from './module/users/users.module.js';
import { WalletModule } from './module/wallet/wallet.module.js';

function isArcjetClient(instance: unknown): boolean {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'protect' in instance &&
    'withRule' in instance
  );
}

/**
 * `skipInstrumentation` receives the provider, so this must recognise
 * `PgService` — which wraps the pool rather than being it. Proxying either the
 * service or the raw `pg.Pool` breaks the pool's own bookkeeping.
 */
function isDatabaseClient(instance: unknown): boolean {
  return (
    typeof instance === 'object' &&
    instance !== null &&
    'query' in instance &&
    ('pool' in instance || ('connect' in instance && 'end' in instance))
  );
}

export const { ObserveModule, ObserveInstrument } = createObserveModule({
  skipInstrumentation: (instance) =>
    instance instanceof ArcjetGuard ||
    isArcjetClient(instance) ||
    isDatabaseClient(instance),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config: Record<string, unknown>) {
        if (typeof config.ARCJET_KEY !== 'string' || config.ARCJET_KEY.length === 0) {
          throw new Error(
            'ARCJET_KEY must be set in the environment. Get your key at https://app.arcjet.com',
          );
        }
        validateAuthEnv(config);
        if (typeof config.DATABASE_URL !== 'string' || config.DATABASE_URL.length === 0) {
          throw new Error('DATABASE_URL is required for PostgreSQL and Better Auth');
        }
        return config;
      },
    }),
    ArcjetProtectionModule,
    PgModule,
    AppAuthModule,
    UsersModule,
    BillsModule,
    DepositsModule,
    ExpensesModule,
    InstallmentsModule,
    LedgerModule,
    DashboardModule,
    WalletModule,
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'app-money',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
