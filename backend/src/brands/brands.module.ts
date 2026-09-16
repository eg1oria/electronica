import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminBrandsController } from './admin-brands.controller';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  imports: [UploadsModule],
  controllers: [BrandsController, AdminBrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
