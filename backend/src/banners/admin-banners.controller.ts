import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { ReorderBannersDto, UpdateBannerDto } from './dto/update-banner.dto';

@Controller('admin/banners')
@AdminOnly()
export class AdminBannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  findAll() {
    return this.banners.findAll();
  }

  /** Порядок слайдов: `{ ids }` — все id в новом порядке. */
  @Put('order')
  reorder(@Body() { ids }: ReorderBannersDto) {
    return this.banners.reorder(ids);
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.banners.findById(id);
  }

  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.banners.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.banners.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.banners.remove(id);
  }
}
