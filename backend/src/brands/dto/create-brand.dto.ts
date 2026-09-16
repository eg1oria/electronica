import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IMAGE_URL_MESSAGE,
  IMAGE_URL_PATTERN,
  SLUG_MESSAGE,
  SLUG_PATTERN,
} from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';

export class CreateBrandDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  /** Если не указан — генерируется из name. */
  @IsOptional()
  @Trim()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  @IsOptional()
  @Trim()
  @MaxLength(2048)
  @Matches(IMAGE_URL_PATTERN, { message: `logo ${IMAGE_URL_MESSAGE}` })
  logo?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}
