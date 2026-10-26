import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { BillsService } from './bills.service.js';
import { SaveBillDto } from './dto/save-bill.dto.js';

@Controller('bills')
export class BillsController {
  constructor(private readonly bills: BillsService) {}

  @Get()
  list(@Session() session: UserSession) {
    return this.bills.list(session.user.id);
  }

  @Post()
  create(@Session() session: UserSession, @Body() dto: SaveBillDto) {
    return this.bills.create(session.user.id, dto);
  }

  @Get(':id/logo')
  @Header('Cache-Control', 'private, max-age=3600')
  async logo(@Session() session: UserSession, @Param('id') id: string) {
    const logo = await this.bills.getLogo(session.user.id, id);
    return new StreamableFile(logo.bytes, { type: logo.mediaType });
  }

  @Get(':id')
  getById(@Session() session: UserSession, @Param('id') id: string) {
    return this.bills.getById(session.user.id, id);
  }

  @Patch(':id')
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: SaveBillDto,
  ) {
    return this.bills.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Session() session: UserSession, @Param('id') id: string) {
    return this.bills.remove(session.user.id, id);
  }
}
