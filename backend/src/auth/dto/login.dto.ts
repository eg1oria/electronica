import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/trim.decorator';

export class LoginDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  login: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
