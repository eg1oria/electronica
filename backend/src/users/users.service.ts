import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { AuthUser } from '../auth/jwt.strategy';
import { Prisma, Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const BCRYPT_ROUNDS = 10;

/** Наружу отдаём всё, кроме хэша пароля и служебного tokenVersion. */
const select = {
  id: true,
  login: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select,
      orderBy: [{ role: 'asc' }, { login: 'asc' }],
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select });
    if (!user) throw new NotFoundException('Сотрудник не найден');
    return user;
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        login: dto.login,
        name: dto.name || null,
        role: dto.role ?? Role.MANAGER,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      },
      select,
    });
  }

  /**
   * Смена пароля или роли поднимает tokenVersion — выданные раньше токены
   * сотрудника сразу перестают работать.
   */
  async update(id: number, dto: UpdateUserDto, actor: AuthUser) {
    const current = await this.findById(id);
    const data: Prisma.UserUpdateInput = {};

    if (dto.login !== undefined) data.login = dto.login;
    if (dto.name !== undefined) data.name = dto.name || null;

    if (dto.role !== undefined && dto.role !== current.role) {
      if (current.id === actor.id) {
        throw new BadRequestException(
          'Нельзя изменить свою роль — попросите другого администратора',
        );
      }
      if (current.role === Role.ADMIN) await this.assertNotLastAdmin(id);
      data.role = dto.role;
    }

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    if (data.role !== undefined || data.passwordHash !== undefined) {
      data.tokenVersion = { increment: 1 };
    }

    return this.prisma.user.update({ where: { id }, data, select });
  }

  async remove(id: number, actor: AuthUser) {
    if (id === actor.id) {
      throw new BadRequestException(
        'Нельзя удалить собственную учётную запись',
      );
    }
    const user = await this.findById(id);
    if (user.role === Role.ADMIN) await this.assertNotLastAdmin(id);
    await this.prisma.user.delete({ where: { id } });
  }

  /** Магазин без администратора остался бы без доступа к админке. */
  private async assertNotLastAdmin(id: number) {
    const others = await this.prisma.user.count({
      where: { role: Role.ADMIN, id: { not: id } },
    });
    if (!others) {
      throw new BadRequestException(
        'Это последний администратор — сначала назначьте администратором кого-то ещё',
      );
    }
  }
}
