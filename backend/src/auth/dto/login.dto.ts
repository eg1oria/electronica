import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/trim.decorator';

export class LoginDto {
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
