import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client';

const FIELD_NAMES: Record<string, string> = {
  slug: 'slug',
  sku: 'артикул',
  login: 'логин',
};

/** "Product_sku_key" → "sku" */
function constraintField(error: Prisma.PrismaClientKnownRequestError) {
  const meta = error.meta as
    | {
        target?: string[];
        driverAdapterError?: { cause?: { constraint?: { index?: string } } };
      }
    | undefined;
  const field =
    meta?.target?.[0] ??
    meta?.driverAdapterError?.cause?.constraint?.index?.match(
      /^[^_]+_(.+)_key$/,
    )?.[1];
  return field ? (FIELD_NAMES[field] ?? field) : undefined;
}

/** Переводит известные ошибки Prisma в понятные HTTP-ответы вместо 500. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    super.catch(this.toHttp(error), host);
  }

  private toHttp(error: Prisma.PrismaClientKnownRequestError): unknown {
    switch (error.code) {
      case 'P2002': {
        const field = constraintField(error);
        return new ConflictException(
          field
            ? `Значение поля «${field}» уже занято`
            : 'Запись с таким значением уже существует',
        );
      }
      case 'P2003':
        return new ConflictException(
          'Операция нарушает связь с другими записями',
        );
      case 'P2020':
        return new BadRequestException('Значение вне допустимого диапазона');
      case 'P2025':
        return new NotFoundException('Запись не найдена');
      default:
        return error;
    }
  }
}
