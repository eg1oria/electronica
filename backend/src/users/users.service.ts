import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { id: 'asc' },
    });
  }

  async create({ password, email, ...rest }: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...rest,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
      },
      select: userSelect,
    });
  }

  async update(id: number, { password, email, ...rest }: UpdateUserDto) {
    const user = await this.findOrFail(id);
    if (user.role === Role.ADMIN && rest.role && rest.role !== Role.ADMIN) {
      await this.assertNotLastAdmin();
    }
    // Смена пароля или роли отзывает все выданные токены пользователя.
    const revokeTokens = !!password || (!!rest.role && rest.role !== user.role);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(email && { email: email.toLowerCase() }),
        ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
        ...(revokeTokens && { tokenVersion: { increment: 1 } }),
      },
      select: userSelect,
    });
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('Нельзя удалить самого себя');
    }
    const user = await this.findOrFail(id);
    if (user.role === Role.ADMIN) await this.assertNotLastAdmin();
    await this.prisma.user.delete({ where: { id } });
  }

  private async findOrFail(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private async assertNotLastAdmin() {
    const admins = await this.prisma.user.count({ where: { role: Role.ADMIN } });
    if (admins <= 1) {
      throw new BadRequestException(
        'Нельзя удалить или понизить последнего администратора',
      );
    }
  }
}
