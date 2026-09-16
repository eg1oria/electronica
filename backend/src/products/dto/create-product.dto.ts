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
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProductImageDto {
  /** URL, полученный из POST /api/admin/uploads, или внешняя ссылка. */
  @IsString()
  @MinLength(1)
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;
}

export class ProductSpecDto {
  /** Например: "Процессор" */
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  /** Например: "Apple M3" */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  value: string;

  /** Например: "Производительность" — для группировки на странице товара. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  group?: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  /** Если не указан — генерируется из name. */
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug может содержать только a-z, 0-9 и дефисы',
  })
  slug?: string;

  /** Артикул */
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  /** Старая цена — для отображения скидки. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oldPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
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
  warrantyMonths?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number | null;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsInt()
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
