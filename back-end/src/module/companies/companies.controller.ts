import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CompaniesService } from './companies.service.js';
import { SaveCompanyDto } from './dto/save-company.dto.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Session() session: UserSession) {
    return this.companies.list(session.user.id);
  }

  @Post()
  create(@Session() session: UserSession, @Body() dto: SaveCompanyDto) {
    return this.companies.create(session.user.id, dto);
  }

  @Get(':id/logo')
  async logo(@Session() session: UserSession, @Param('id') id: string) {
    const logo = await this.companies.getLogo(session.user.id, id);
    return new StreamableFile(logo.bytes, { type: logo.mediaType });
  }

  @Get(':id')
  get(@Session() session: UserSession, @Param('id') id: string) {
    return this.companies.getById(session.user.id, id);
  }

  @Patch(':id')
  update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: SaveCompanyDto,
  ) {
    return this.companies.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Session() session: UserSession, @Param('id') id: string) {
    await this.companies.remove(session.user.id, id);
  }
}
