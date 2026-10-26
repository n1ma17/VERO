import { Controller, Get, Query } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { LedgerQueryDto } from './dto/ledger-query.dto.js';
import { LedgerService } from './ledger.service.js';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  getMonth(@Session() session: UserSession, @Query() query: LedgerQueryDto) {
    return this.ledger.getMonth(session.user.id, query.date);
  }
}
