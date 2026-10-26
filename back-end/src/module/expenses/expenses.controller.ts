import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { SaveExpenseDto } from './dto/save-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(@Session() session: UserSession) {
    return this.expenses.list(session.user.id);
  }

  @Post()
  create(@Session() session: UserSession, @Body() dto: SaveExpenseDto) {
    return this.expenses.create(session.user.id, dto);
  }

  @Get(':id')
  getById(@Session() session: UserSession, @Param('id') id: string) {
    return this.expenses.getById(session.user.id, id);
  }

  @Patch(':id')
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: SaveExpenseDto,
  ) {
    return this.expenses.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Session() session: UserSession, @Param('id') id: string) {
    return this.expenses.remove(session.user.id, id);
  }
}
