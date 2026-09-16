import { PartialType } from '@nestjs/mapped-types';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_INT } from '../../common/validation/limits';
import { CreateProductDto } from './create-product.dto';

/** images/specs, если переданы, полностью заменяют текущие. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  stock: number;
}
