import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { diskStorage } from 'multer';
import { AdminOnly } from '../auth/admin.decorator';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  UPLOAD_DIR,
  UPLOAD_URL_PREFIX,
} from './uploads.constants';

mkdirSync(UPLOAD_DIR, { recursive: true });

@Controller('admin/uploads')
@AdminOnly()
export class UploadsController {
  /** multipart/form-data, поле `file`. Возвращает URL для images[].url. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) =>
          cb(null, randomUUID() + ALLOWED_IMAGE_TYPES[file.mimetype]),
      }),
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_TYPES[file.mimetype]) return cb(null, true);
        cb(
          new BadRequestException(
            'Допустимы только изображения JPEG, PNG, WebP или AVIF',
          ),
          false,
        );
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    return {
      url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Delete(':filename')
  @HttpCode(204)
  async remove(@Param('filename') filename: string) {
    if (!/^[0-9a-f-]{36}\.[a-z]+$/.test(filename)) {
      throw new BadRequestException('Некорректное имя файла');
    }
    try {
      await unlink(join(UPLOAD_DIR, filename));
    } catch {
      throw new NotFoundException('Файл не найден');
    }
  }
}
