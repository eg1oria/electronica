import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  IMAGE_URL_MESSAGE,
  IMAGE_URL_PATTERN,
  MAX_INT,
  MAX_PRICE,
  SLUG_MESSAGE,
  SLUG_PATTERN,
} from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';

export class ProductImageDto {
  /** URL из POST /api/admin/uploads или внешняя http(s)-ссылка. */
  @Trim()
  @MaxLength(2048)
  @Matches(IMAGE_URL_PATTERN, { message: `url ${IMAGE_URL_MESSAGE}` })
  url: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  alt?: string | null;
}

export class ProductSpecDto {
  /** Например: "Процессор" */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  /** Например: "Apple M3" */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  value: string;

  /** Например: "Производительность" — для группировки на странице товара. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  group?: string | null;
}

export class CreateProductDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  /** Если не указан — генерируется из name. */
  @IsOptional()
  @Trim()
  @MaxLength(100)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  /** Артикул */
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  shortDescription?: string | null;

  @Trim()
  @IsString()
  @MaxLength(50_000)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  /** Старая цена — для отображения скидки, должна быть больше price. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_PRICE)
  oldPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1200)
  warrantyMonths?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  weightGrams?: number | null;

  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  categoryId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  brandId?: number | null;

  /** Порядок в массиве = порядок фото, первое — главное. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  specs?: ProductSpecDto[];
}
