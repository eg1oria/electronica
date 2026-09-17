import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/validation/trim.decorator';
import {
  TELEGRAM_CHAT_MESSAGE,
  TELEGRAM_CHAT_PATTERN,
} from '../settings.constants';

export class UpdateTelegramDto {
  /** Поле не передано — токен остаётся прежним; пустая строка — стереть. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  botToken?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  @Matches(new RegExp(`${TELEGRAM_CHAT_PATTERN.source}|^$`), {
    message: TELEGRAM_CHAT_MESSAGE,
  })
  chatId?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
