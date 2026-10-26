import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule as NestBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { PgModule } from '../database/pg.module.js';
import { PgService } from '../database/pg.service.js';
import { createAuth } from './auth.config.js';
import { AuthMailService } from './auth-mail.service.js';

@Global()
@Module({
  imports: [
    NestBetterAuthModule.forRootAsync({
      imports: [ConfigModule, PgModule],
      inject: [PgService, ConfigService, AuthMailService],
      useFactory: (
        pg: PgService,
        config: ConfigService,
        mail: AuthMailService,
      ) => ({
        auth: createAuth(pg, config, mail),
        // CORS is enabled once in main.ts so headers are not duplicated.
        disableTrustedOriginsCors: true,
      }),
    }),
  ],
  providers: [AuthMailService],
  exports: [AuthMailService, NestBetterAuthModule],
})
export class AppAuthModule {}
