import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@AdminOnly(Role.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.users.remove(id, user.id);
  }
}
