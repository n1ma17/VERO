import { ArcjetGuard, ArcjetModule, fixedWindow, shield } from '@arcjet/nest';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { arcjetRuleMode } from './arcjet-rule-mode.js';

/**
 * Global Arcjet protection: Shield WAF plus a generous fixed window so the
 * Vue app can hydrate several resources after login without being throttled.
 */
@Global()
@Module({
  imports: [
    ArcjetModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mode = arcjetRuleMode(config);

        return {
          key: config.get<string>('ARCJET_KEY')!,
          rules: [
            shield({ mode }),
            fixedWindow({ mode, window: 60, max: 120 }),
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ArcjetGuard,
    },
  ],
})
export class ArcjetProtectionModule {}
