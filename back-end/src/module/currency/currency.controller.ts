import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UpdateCurrencyDto } from './dto/update-currency.dto.js';
import { CurrencyService } from './currency.service.js';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currency: CurrencyService) {}

  @Get()
  get(@Session() session: UserSession) {
    return this.currency.getSettings(session.user.id);
  }

  @Patch()
  update(@Session() session: UserSession, @Body() dto: UpdateCurrencyDto) {
    return this.currency.update(session.user.id, dto);
  }
}
