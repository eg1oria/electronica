import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminOnly } from '../auth/admin.decorator';
import { Role } from '../generated/prisma/client';
import { UpdateTelegramDto } from './dto/update-telegram.dto';
import { SettingsService } from './settings.service';

/** Настройки магазина меняет только администратор. */
@Controller('admin/settings')
@AdminOnly(Role.ADMIN)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('telegram')
  telegram() {
    return this.settings.telegramView();
  }

  @Put('telegram')
  updateTelegram(@Body() dto: UpdateTelegramDto) {
    return this.settings.updateTelegram(dto);
  }

  /** Обращения к Bot API ограничиваем — 10 в минуту. */
  @Post('telegram/test')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  test() {
    return this.settings.sendTestMessage();
  }

  @Post('telegram/chats')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  chats() {
    return this.settings.detectChats();
  }
}
