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
import { FxModule } from './lib/fx/fx.module.js';
import { BillsModule } from './module/bills/bills.module.js';
import { CurrencyModule } from './module/currency/currency.module.js';
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

/**
 * Nest Observe (observe.nestjs.com) needs a real app key/secret. Placeholder
 * values get 429 rate-limits and spam the console; leave unset for localdev.
 */
function observeCredential(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('YOUR_')) return undefined;
  return trimmed;
}

export const observeEnabled = Boolean(
  observeCredential(process.env.OBSERVE_APP_KEY) &&
    observeCredential(process.env.OBSERVE_APP_SECRET),
);

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
    FxModule,
    AppAuthModule,
    UsersModule,
    CurrencyModule,
    BillsModule,
    DepositsModule,
    ExpensesModule,
    InstallmentsModule,
    LedgerModule,
    DashboardModule,
    WalletModule,
    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: observeCredential(process.env.OBSERVE_APP_KEY)!,
            appSecret: observeCredential(process.env.OBSERVE_APP_SECRET)!,
            serviceId: process.env.OBSERVE_SERVICE_ID?.trim() || 'app-money',
          }),
        ]
      : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
