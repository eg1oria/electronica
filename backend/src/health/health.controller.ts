import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Для Docker HEALTHCHECK и балансировщиков. */
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok' };
  }
}
