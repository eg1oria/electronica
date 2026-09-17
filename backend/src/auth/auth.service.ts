import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

// Хэш-заглушка: сравнение выполняется и для несуществующего логина,
// чтобы по времени ответа нельзя было узнать, есть ли такой логин.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login({ login, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: login.toLowerCase() },
    });
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const payload: JwtPayload = { sub: user.id, ver: user.tokenVersion };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
      },
    };
  }
}
