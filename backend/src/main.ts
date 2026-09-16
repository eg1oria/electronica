import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  setupApp(app);

  const origins = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!origins?.length && process.env.NODE_ENV === 'production') {
    Logger.warn('CORS_ORIGIN не задан — API доступно с любого сайта', 'CORS');
  }
  app.enableCors({ origin: origins?.length ? origins : true });

  // За nginx/балансировщиком — чтобы лимиты запросов считались по реальному IP.
  if (process.env.TRUST_PROXY) {
    const value = process.env.TRUST_PROXY;
    app.set('trust proxy', /^\d+$/.test(value) ? Number(value) : value);
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API запущено на http://localhost:${port}/api`, 'Bootstrap');
}
void bootstrap();
