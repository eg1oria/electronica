import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

/** Общая настройка приложения — используется в main.ts и e2e-тестах. */
export function setupApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      // Картинки из /uploads загружает фронтенд с другого origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useBodyParser('json', { limit: '1mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  app.enableShutdownHooks();
}
