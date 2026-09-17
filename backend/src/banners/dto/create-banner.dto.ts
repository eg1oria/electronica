import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  IMAGE_URL_MESSAGE,
  IMAGE_URL_PATTERN,
  MAX_INT,
} from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';

export class CreateBannerDto {
  /** Товар, на который ведут кнопки слайда. */
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  productId: number;

  /** Пусто — «Хит продаж». */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  /** Пусто — название товара. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  title?: string | null;

  /** Пусто — краткое описание товара. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  subtitle?: string | null;

  /** Пусто — главное фото товара. */
  @IsOptional()
  @Trim()
  @MaxLength(2048)
  @Matches(IMAGE_URL_PATTERN, { message: `image ${IMAGE_URL_MESSAGE}` })
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
