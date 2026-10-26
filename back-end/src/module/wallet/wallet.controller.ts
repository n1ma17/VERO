import { Body, Controller, Get, Put } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ImportWalletDto } from './dto/import-wallet.dto.js';
import { WalletService } from './wallet.service.js';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  snapshot(@Session() session: UserSession) {
    return this.wallet.snapshot(session.user.id);
  }

  @Put()
  importSnapshot(@Session() session: UserSession, @Body() dto: ImportWalletDto) {
    return this.wallet.importSnapshot(session.user.id, dto);
  }
}
