import { Module } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller';
import { OrderNotifier } from './order-notifier.service';
import { SettingsService } from './settings.service';
import { TelegramApi } from './telegram.api';

@Module({
  controllers: [AdminSettingsController],
  providers: [SettingsService, TelegramApi, OrderNotifier],
  exports: [SettingsService, OrderNotifier],
})
export class SettingsModule {}
