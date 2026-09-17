import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { MAX_INT } from '../../common/validation/limits';
import { MAX_BANNERS } from '../banners.constants';
import { CreateBannerDto } from './create-banner.dto';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class ReorderBannersDto {
  /** Все id баннеров в новом порядке. */
  @IsArray()
  @ArrayMaxSize(MAX_BANNERS)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(MAX_INT, { each: true })
  ids: number[];
}
