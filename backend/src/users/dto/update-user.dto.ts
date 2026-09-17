import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/** Пароль передаётся, только когда его меняют. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
