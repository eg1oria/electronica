export const JWT_SECRET_PLACEHOLDER = 'change-me-to-a-long-random-string';

/** Проверка переменных окружения при старте — приложение не запустится с битым конфигом. */
export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const secret = typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';

  if (!config.DATABASE_URL) errors.push('DATABASE_URL не задан');
  if (secret.length < 32) {
    errors.push('JWT_SECRET должен быть не короче 32 символов');
  }
  if (
    config.NODE_ENV === 'production' &&
    secret === JWT_SECRET_PLACEHOLDER
  ) {
    errors.push('JWT_SECRET не изменён со значения из .env.example');
  }
  if (config.PORT !== undefined && !/^\d+$/.test(String(config.PORT))) {
    errors.push('PORT должен быть числом');
  }

  if (errors.length) {
    throw new Error(`Ошибка конфигурации:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
