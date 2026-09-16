import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

/**
 * Защищает контроллер/метод админки. Без аргументов пускает ADMIN и MANAGER.
 */
export function AdminOnly(...roles: Role[]) {
  return applyDecorators(
    Roles(...(roles.length ? roles : [Role.ADMIN, Role.MANAGER])),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
