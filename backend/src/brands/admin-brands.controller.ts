import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller('admin/brands')
@AdminOnly()
export class AdminBrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  findAll() {
    return this.brands.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.brands.findById(id);
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.brands.remove(id);
  }
}
