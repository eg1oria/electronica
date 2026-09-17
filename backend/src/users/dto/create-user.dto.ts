import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '../../common/validation/trim.decorator';
import { Role } from '../../generated/prisma/client';

export const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
export const LOGIN_MESSAGE =
  'логин может содержать только латиницу, цифры, точку, дефис и подчёркивание';

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt читает только первые 72 байта пароля. */
export const MAX_PASSWORD_LENGTH = 72;

/** Логин не зависит от регистра — приводим к нижнему при вводе. */
const Lower = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

export class CreateUserDto {
  @Lower()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(LOGIN_PATTERN, { message: LOGIN_MESSAGE })
  login: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(MAX_PASSWORD_LENGTH)
  password: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  /** По умолчанию — менеджер: полные права даёт только явный ADMIN. */
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
