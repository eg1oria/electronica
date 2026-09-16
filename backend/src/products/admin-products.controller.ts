import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { AdminQueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('admin/products')
@AdminOnly()
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query() query: AdminQueryProductsDto) {
    return this.products.findAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.products.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Patch(':id/stock')
  updateStock(
    @Param('id', ParseIdPipe) id: number,
    @Body() { stock }: UpdateStockDto,
  ) {
    return this.products.updateStock(id, stock);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.products.remove(id);
  }
}
