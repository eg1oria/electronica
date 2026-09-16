import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { AdminOnly } from '../auth/admin.decorator';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  UPLOAD_DIR,
} from './uploads.constants';
import { UploadsService } from './uploads.service';

@Controller('admin/uploads')
@AdminOnly()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** multipart/form-data, поле `file`. Возвращает URL для images[].url. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) =>
          cb(null, randomUUID() + ALLOWED_IMAGE_TYPES[file.mimetype]),
      }),
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 0 },
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
  async upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Файл не передан (поле "file")');
    await this.uploads.assertImage(file);
    return {
      url: this.uploads.urlFor(file.filename),
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /** Удаляет файл, если он нигде не используется. */
  @Delete(':filename')
  @HttpCode(204)
  remove(@Param('filename') filename: string) {
    return this.uploads.remove(filename);
  }
}
