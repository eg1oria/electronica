import { join, resolve } from 'node:path';

export const UPLOAD_DIR = resolve(
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'),
);
export const UPLOAD_URL_PREFIX = '/uploads';
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};
/** Имена, которые генерирует сервер: uuid + расширение. */
export const UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;
