import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Session() session: UserSession) {
    return this.usersService.getProfile(session.user.id);
  }

  @Patch('me')
  updateMe(
    @Session() session: UserSession,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(session.user.id, dto);
  }

  @Get(':id')
  getById(
    @CurrentUser() user: UserSession['user'],
    @Param('id') id: string,
  ) {
    return this.usersService.getById(user.id, id);
  }
}
