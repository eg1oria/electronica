import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  IMAGE_URL_MESSAGE,
  IMAGE_URL_PATTERN,
  MAX_INT,
  SLUG_MESSAGE,
  SLUG_PATTERN,
} from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';

export class CreateCategoryDto {
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
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @Trim()
  @MaxLength(2048)
  @Matches(IMAGE_URL_PATTERN, { message: `image ${IMAGE_URL_MESSAGE}` })
  image?: string | null;

  /** null — сделать категорию корневой. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  parentId?: number | null;
}
