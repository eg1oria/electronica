import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTelegramDto } from './dto/update-telegram.dto';
import {
  SETTINGS_ID,
  TELEGRAM_TOKEN_MESSAGE,
  TELEGRAM_TOKEN_PATTERN,
} from './settings.constants';
import {
  TelegramApi,
  TelegramError,
  TelegramUnavailableError,
  chatTitle,
} from './telegram.api';

/** Куда слать уведомление о заказе. */
export type TelegramTarget = { token: string; chatId: string };

/**
 * Токен наружу не отдаём: в админке показываем id бота и хвост,
 * чтобы было видно, какой именно токен сохранён.
 */
function maskToken(token: string) {
  const [botId] = token.split(':');
  return `${botId}:••••${token.slice(-4)}`;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramApi,
  ) {}

  /** Настройки Telegram для админки — без самого токена. */
  async telegramView() {
    const s = await this.read();
    return {
      enabled: s?.telegramEnabled ?? false,
      chatId: s?.telegramChatId ?? null,
      botUsername: s?.telegramBotUsername ?? null,
      tokenPreview: s?.telegramBotToken ? maskToken(s.telegramBotToken) : null,
      updatedAt: s?.updatedAt ?? null,
    };
  }

  /** null — уведомления выключены или настроены не полностью. */
  async telegramTarget(): Promise<TelegramTarget | null> {
    const s = await this.read();
    if (!s?.telegramEnabled || !s.telegramBotToken || !s.telegramChatId) {
      return null;
    }
    return { token: s.telegramBotToken, chatId: s.telegramChatId };
  }

  async updateTelegram(dto: UpdateTelegramDto) {
    const current = await this.read();
    const token =
      dto.botToken === undefined
        ? (current?.telegramBotToken ?? null)
        : dto.botToken || null;
    const chatId =
      dto.chatId === undefined
        ? (current?.telegramChatId ?? null)
        : dto.chatId || null;
    const enabled = dto.enabled ?? current?.telegramEnabled ?? false;

    if (token && !TELEGRAM_TOKEN_PATTERN.test(token)) {
      throw new BadRequestException(TELEGRAM_TOKEN_MESSAGE);
    }
    if (enabled && (!token || !chatId)) {
      throw new BadRequestException(
        'Чтобы включить уведомления, укажите токен бота и чат',
      );
    }

    let botUsername = current?.telegramBotUsername ?? null;
    if (!token) botUsername = null;
    else if (token !== current?.telegramBotToken) {
      botUsername = await this.checkToken(token);
    }

    const data = {
      telegramBotToken: token,
      telegramBotUsername: botUsername,
      telegramChatId: chatId,
      telegramEnabled: enabled,
    };
    await this.prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
    return this.telegramView();
  }

  /** Тестовое сообщение — работает и до включения уведомлений. */
  async sendTestMessage() {
    const { token, chatId } = await this.requireTarget();
    try {
      await this.telegram.sendMessage(
        token,
        chatId,
        '✅ <b>NovaLink</b>\nПроверка связи: уведомления о заказах будут приходить сюда.',
      );
    } catch (error) {
      throw new BadRequestException(this.message(error));
    }
    return { ok: true };
  }

  /** Чаты, которые писали боту, — чтобы выбрать нужный вместо ввода id. */
  async detectChats() {
    const token = await this.requireToken();
    try {
      const chats = await this.telegram.recentChats(token);
      return chats.map((chat) => ({
        id: String(chat.id),
        title: chatTitle(chat),
        type: chat.type,
      }));
    } catch (error) {
      throw new BadRequestException(this.message(error));
    }
  }

  private read() {
    return this.prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  }

  /** Токен нужен для любого обращения к Bot API. */
  private async requireToken() {
    const s = await this.read();
    if (!s?.telegramBotToken) {
      throw new BadRequestException('Сначала сохраните токен бота');
    }
    return s.telegramBotToken;
  }

  /** Для отправки нужен ещё и чат — независимо от того, включены ли уведомления. */
  private async requireTarget(): Promise<TelegramTarget> {
    const s = await this.read();
    if (!s?.telegramBotToken) {
      throw new BadRequestException('Сначала сохраните токен бота');
    }
    if (!s.telegramChatId) {
      throw new BadRequestException('Укажите чат, куда слать уведомления');
    }
    return { token: s.telegramBotToken, chatId: s.telegramChatId };
  }

  /** Недоступный Telegram не должен мешать сохранить токен. */
  private async checkToken(token: string) {
    try {
      const me = await this.telegram.getMe(token);
      return me.username ?? null;
    } catch (error) {
      if (error instanceof TelegramUnavailableError) {
        this.logger.warn(`Токен сохранён без проверки: ${error.message}`);
        return null;
      }
      throw new BadRequestException(this.message(error));
    }
  }

  private message(error: unknown) {
    return error instanceof TelegramError
      ? error.message
      : 'Не удалось связаться с Telegram';
  }
}
