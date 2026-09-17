import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MAX_INT } from '../../common/validation/limits';
import { Trim } from '../../common/validation/trim.decorator';
import { DeliveryMethod, PaymentMethod } from '../../generated/prisma/client';

export const MAX_ORDER_QTY = 99;

export class OrderItemDto {
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_QTY)
  qty: number;
}

export class CreateOrderDto {
  @Trim()
  @IsString({ message: 'Укажите имя' })
  @Length(2, 100, { message: 'Имя должно быть от 2 до 100 символов' })
  customerName: string;

  /** Цифры, пробелы, скобки, плюс и дефисы; не меньше 10 цифр. */
  @Trim()
  @IsString()
  @MaxLength(20)
  @Matches(/^(?=(?:\D*\d){10,15}\D*$)[\d\s()+-]+$/, {
    message: 'Некорректный номер телефона',
  })
  phone: string;

  @IsOptional()
  @Trim()
  @MaxLength(254)
  @IsEmail({}, { message: 'Некорректный email' })
  email?: string | null;

  @IsEnum(DeliveryMethod)
  delivery: DeliveryMethod;

  /** Для курьерской доставки обязательны город и адрес. */
  @ValidateIf((o: CreateOrderDto) => o.delivery === DeliveryMethod.COURIER)
  @Trim()
  @IsString({ message: 'Укажите город' })
  @Length(2, 100, { message: 'Укажите город' })
  city?: string | null;

  @ValidateIf((o: CreateOrderDto) => o.delivery === DeliveryMethod.COURIER)
  @Trim()
  @IsString({ message: 'Укажите адрес доставки' })
  @Length(3, 300, { message: 'Укажите адрес доставки' })
  address?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(50)
  apartment?: string | null;

  @IsEnum(PaymentMethod)
  payment: PaymentMethod;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  comment?: string | null;

  @IsArray()
  @ArrayMinSize(1, { message: 'Корзина пуста' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
