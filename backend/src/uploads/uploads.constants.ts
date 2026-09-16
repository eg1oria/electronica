import { join } from 'node:path';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');
export const UPLOAD_URL_PREFIX = '/uploads';
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};
