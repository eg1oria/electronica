import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client';

/** Переводит известные ошибки Prisma в понятные HTTP-ответы. */
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
        const target = (error.meta?.target as string[] | undefined)?.join(', ');
        return new ConflictException(
          target
            ? `Запись с таким значением уже существует (${target})`
            : 'Запись с таким значением уже существует',
        );
      }
      case 'P2003':
        return new ConflictException(
          'Операция нарушает связь с другими записями',
        );
      case 'P2025':
        return new NotFoundException('Запись не найдена');
      default:
        return error;
    }
  }
}
