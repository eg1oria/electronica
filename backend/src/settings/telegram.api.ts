import { Injectable } from '@nestjs/common';
import { TELEGRAM_API_URL, TELEGRAM_TIMEOUT_MS } from './settings.constants';

/** Telegram ответил отказом: неверный токен, неизвестный чат и т.п. */
export class TelegramError extends Error {}

/** До Telegram не достучались — сеть или таймаут. Настройку это не отменяет. */
export class TelegramUnavailableError extends TelegramError {}

type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type Update = {
  message?: { chat: TelegramChat };
  channel_post?: { chat: TelegramChat };
  my_chat_member?: { chat: TelegramChat };
};

/** Понятные сообщения вместо английских ответов Telegram. */
const DESCRIPTIONS: [RegExp, string][] = [
  [
    /unauthorized/i,
    'Telegram не принял токен бота — проверьте его у @BotFather',
  ],
  [/chat not found/i, 'Чат не найден: бот не знает такой chat ID'],
  [
    /bot was blocked|bot can't initiate conversation|user is deactivated/i,
    'Бот не может написать в этот чат — откройте диалог с ботом и отправьте ему /start',
  ],
  [
    /not a member|not enough rights|forbidden/i,
    'Бота нет в этом чате или у него нет права писать — добавьте его в чат',
  ],
  [
    /terminated by other getupdates|webhook is active/i,
    'У бота включён webhook или он уже слушает обновления — определить чат не получится, введите chat ID вручную',
  ],
];

function describe(description: string | undefined, status: number) {
  for (const [pattern, message] of DESCRIPTIONS) {
    if (description && pattern.test(description)) return message;
  }
  return description
    ? `Telegram: ${description}`
    : `Telegram ответил ошибкой (${status})`;
}

/** Тонкий клиент Bot API: без доступа к базе, токен всегда передаётся явно. */
@Injectable()
export class TelegramApi {
  async getMe(token: string) {
    return this.call<{ id: number; username?: string }>(token, 'getMe');
  }

  async sendMessage(token: string, chatId: string, text: string) {
    await this.call(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  }

  /** Чаты, которые недавно писали боту, — чтобы не искать chat ID вручную. */
  async recentChats(token: string): Promise<TelegramChat[]> {
    const updates = await this.call<Update[]>(token, 'getUpdates', {
      limit: 100,
      allowed_updates: ['message', 'channel_post', 'my_chat_member'],
    });
    const byId = new Map<number, TelegramChat>();
    for (const update of updates) {
      const chat =
        update.message?.chat ??
        update.channel_post?.chat ??
        update.my_chat_member?.chat;
      if (chat) byId.set(chat.id, chat);
    }
    return [...byId.values()];
  }

  private async call<T>(
    token: string,
    method: string,
    body: unknown = {},
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${TELEGRAM_API_URL}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
    } catch {
      throw new TelegramUnavailableError(
        'Telegram не отвечает — проверьте подключение сервера к интернету',
      );
    }
    const data = (await res
      .json()
      .catch(() => null)) as TelegramResponse<T> | null;
    if (!data?.ok)
      throw new TelegramError(describe(data?.description, res.status));
    return data.result as T;
  }
}

/** Человекочитаемое имя чата для выпадающего списка в админке. */
export function chatTitle(chat: TelegramChat) {
  const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  return (
    chat.title ??
    (name || (chat.username ? `@${chat.username}` : `Чат ${chat.id}`))
  );
}
