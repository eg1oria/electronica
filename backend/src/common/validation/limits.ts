/** Максимум для колонок Int в PostgreSQL. */
export const MAX_INT = 2_147_483_647;
/** Максимум для Decimal(12, 2). */
export const MAX_PRICE = 9_999_999_999.99;

/** Своя картинка из /uploads или внешняя http(s)-ссылка. */
export const IMAGE_URL_PATTERN = /^(\/uploads\/[\w.-]+|https?:\/\/\S+)$/;
export const IMAGE_URL_MESSAGE =
  'должен быть путём /uploads/... или ссылкой http(s)://';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MESSAGE = 'slug может содержать только a-z, 0-9 и дефисы';
