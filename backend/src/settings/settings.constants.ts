/** Настройки лежат в единственной строке таблицы. */
export const SETTINGS_ID = 1;

export const TELEGRAM_API_URL = 'https://api.telegram.org';
export const TELEGRAM_TIMEOUT_MS = 8000;

/** Формат токена от @BotFather: 123456789:AA... */
export const TELEGRAM_TOKEN_PATTERN = /^\d{5,16}:[A-Za-z0-9_-]{20,}$/;
export const TELEGRAM_TOKEN_MESSAGE =
  'Токен не похож на выданный @BotFather (например, 123456789:AAH...)';

/** id чата (у групп и каналов — отрицательный) или @username канала. */
export const TELEGRAM_CHAT_PATTERN = /^(-?\d{1,20}|@[A-Za-z]\w{4,31})$/;
export const TELEGRAM_CHAT_MESSAGE =
  'Чат указывается числом (например, 123456789 или -1001234567890) либо как @канал';
