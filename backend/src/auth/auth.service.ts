import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
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
    return {
      accessToken: await this.issueToken(user.id, user.tokenVersion),
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Смена своего пароля. tokenVersion растёт — сессии на других устройствах
   * закрываются, поэтому текущей выдаём новый токен.
   */
  async changePassword(
    userId: number,
    { currentPassword, newPassword }: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Текущий пароль указан неверно');
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException('Новый пароль совпадает с текущим');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        tokenVersion: { increment: 1 },
      },
      select: { id: true, tokenVersion: true },
    });
    return {
      accessToken: await this.issueToken(updated.id, updated.tokenVersion),
    };
  }

  private issueToken(sub: number, ver: number) {
    return this.jwt.signAsync({ sub, ver } satisfies JwtPayload);
  }
}
