import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [UploadsModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
