import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  findAll() {
    return this.banners.findPublic();
  }
}
