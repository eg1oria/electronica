import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  /** tokenVersion пользователя на момент выдачи токена. */
  ver: number;
}

export interface AuthUser {
  id: number;
  login: string;
  name: string | null;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  // Пользователь перечитывается из БД: удалённый сотрудник или сменённый
  // пароль/роль сразу делают старый токен недействительным.
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        login: true,
        name: true,
        role: true,
        tokenVersion: true,
      },
    });
    if (!user || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException();
    }
    const { tokenVersion: _, ...authUser } = user;
    return authUser;
  }
}
