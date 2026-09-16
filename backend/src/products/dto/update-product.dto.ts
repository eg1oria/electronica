import { PartialType } from '@nestjs/mapped-types';
import { IsInt, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

/** images/specs, если переданы, полностью заменяют текущие. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  stock: number;
}
