import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(email && { email: email.toLowerCase() }),
        ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
      },
      select: userSelect,
    });
  }

  async remove(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new BadRequestException('Нельзя удалить самого себя');
    }
    await this.prisma.user.delete({ where: { id } });
  }
}
