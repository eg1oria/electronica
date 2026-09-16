import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.products.findPublic(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findPublicBySlug(slug);
  }
}
