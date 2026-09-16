import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MAX_INT, MAX_PRICE } from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';

export const PRODUCT_SORTS = [
  'newest',
  'price_asc',
  'price_desc',
  'name',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' || value === '1' || value === true
    ? true
    : value === 'false' || value === '0' || value === false
      ? false
      : value;

export class QueryProductsDto extends PaginationDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Включает товары подкатегорий. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorySlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brandSlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(MAX_PRICE)
  maxPrice?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort: ProductSort = 'newest';
}

export class AdminQueryProductsDto extends QueryProductsDto {
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  brandId?: number;
}
