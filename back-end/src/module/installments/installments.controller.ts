import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { SetPaidDto } from './dto/set-paid.dto.js';
import { InstallmentsService } from './installments.service.js';

@Controller('installments')
export class InstallmentsController {
  constructor(private readonly installments: InstallmentsService) {}

  @Get()
  list(@Session() session: UserSession) {
    return this.installments.list(session.user.id);
  }

  @Get(':id')
  getById(@Session() session: UserSession, @Param('id') id: string) {
    return this.installments.getById(session.user.id, id);
  }

  @Patch(':id/paid')
  setPaid(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: SetPaidDto,
  ) {
    return this.installments.setPaid(session.user.id, id, dto.paid);
  }
}
