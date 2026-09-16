import { Controller, Get, Param } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  findAll() {
    return this.brands.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.brands.findBySlug(slug);
  }
}
