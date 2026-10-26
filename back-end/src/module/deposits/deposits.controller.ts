import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { DepositsService } from './deposits.service.js';
import { SaveDepositDto } from './dto/save-deposit.dto.js';

@Controller('deposits')
export class DepositsController {
  constructor(private readonly deposits: DepositsService) {}

  @Get()
  list(@Session() session: UserSession) {
    return this.deposits.list(session.user.id);
  }

  @Post()
  create(@Session() session: UserSession, @Body() dto: SaveDepositDto) {
    return this.deposits.create(session.user.id, dto);
  }

  @Patch(':id')
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: SaveDepositDto,
  ) {
    return this.deposits.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Session() session: UserSession, @Param('id') id: string) {
    return this.deposits.remove(session.user.id, id);
  }
}
