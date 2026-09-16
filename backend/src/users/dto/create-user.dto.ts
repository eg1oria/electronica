import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from '../../common/validation/trim.decorator';
import { Role } from '../../generated/prisma/client';

export class CreateUserDto {
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

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
