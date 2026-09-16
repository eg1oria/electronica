import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { MAX_INT } from '../validation/limits';

/** Как ParseIntPipe, но отсекает числа, которые не влезают в Int PostgreSQL. */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!/^\d+$/.test(value) || id < 1 || id > MAX_INT) {
      throw new BadRequestException('Некорректный id');
    }
    return id;
  }
}
