import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

// Хэш-заглушка: сравнение выполняется и для несуществующего email,
// чтобы по времени ответа нельзя было узнать, есть ли такой пользователь.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    const valid = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const payload: JwtPayload = { sub: user.id, ver: user.tokenVersion };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
