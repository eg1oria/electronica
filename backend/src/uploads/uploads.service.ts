import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { mkdir, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import {
  UPLOAD_DIR,
  UPLOAD_FILENAME_PATTERN,
  UPLOAD_URL_PREFIX,
} from './uploads.constants';

/** Определяет формат по первым байтам файла, а не по заголовку клиента. */
function detectImageType(header: Buffer): string | undefined {
  const ascii = (from: number, to: number) =>
    header.subarray(from, to).toString('latin1');
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg';
  }
  if (header.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    return 'image/png';
  }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) {
    return 'image/avif';
  }
  return undefined;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  urlFor(filename: string) {
    return `${UPLOAD_URL_PREFIX}/${filename}`;
  }

  /** Удаляет загруженный файл, если его содержимое не совпадает с заявленным типом. */
  async assertImage(file: Express.Multer.File) {
    const handle = await open(file.path, 'r');
    const header = Buffer.alloc(16);
    try {
      await handle.read(header, 0, header.length, 0);
    } finally {
      await handle.close();
    }
    if (detectImageType(header) !== file.mimetype) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException(
        'Содержимое файла не соответствует изображению JPEG, PNG, WebP или AVIF',
      );
    }
  }

  async remove(filename: string) {
    if (!UPLOAD_FILENAME_PATTERN.test(filename)) {
      throw new BadRequestException('Некорректное имя файла');
    }
    if (await this.isReferenced(this.urlFor(filename))) {
      throw new ConflictException(
        'Файл используется в товаре, категории или бренде',
      );
    }
    try {
      await unlink(join(UPLOAD_DIR, filename));
    } catch {
      throw new NotFoundException('Файл не найден');
    }
  }

  /**
   * Удаляет с диска файлы из /uploads, на которые больше ничего не ссылается.
   * Вызывается после удаления/замены фото. Ошибки только логируются.
   */
  async removeUnused(urls: (string | null | undefined)[]) {
    const prefix = `${UPLOAD_URL_PREFIX}/`;
    for (const url of new Set(urls)) {
      if (!url?.startsWith(prefix)) continue;
      const filename = url.slice(prefix.length);
      if (!UPLOAD_FILENAME_PATTERN.test(filename)) continue;
      try {
        if (await this.isReferenced(url)) continue;
        await unlink(join(UPLOAD_DIR, filename));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.logger.warn(`Не удалось удалить ${filename}: ${String(error)}`);
        }
      }
    }
  }

  private async isReferenced(url: string) {
    const [images, categories, brands] = await Promise.all([
      this.prisma.productImage.count({ where: { url } }),
      this.prisma.category.count({ where: { image: url } }),
      this.prisma.brand.count({ where: { logo: url } }),
    ]);
    return images + categories + brands > 0;
  }
}
