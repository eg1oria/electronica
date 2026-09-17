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

export class CreateUserDto {
  /** Латиница, цифры, точка, дефис и подчёркивание. */
  @Trim()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'login может содержать только латиницу, цифры, точку, дефис и _',
  })
  login: string;

  /** bcrypt учитывает только первые 72 байта. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
