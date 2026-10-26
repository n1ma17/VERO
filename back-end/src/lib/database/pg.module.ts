import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgService } from './pg.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PgService],
  exports: [PgService],
})
export class PgModule {}
