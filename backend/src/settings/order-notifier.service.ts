import { Injectable, Logger } from '@nestjs/common';
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
} from '../generated/prisma/client';
import { SettingsService } from './settings.service';
import { TelegramApi } from './telegram.api';

/** Заказ в том виде, в каком его отдаёт OrdersService. */
export type NotifiableOrder = {
  id: number;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string | null;
  delivery: DeliveryMethod;
  city: string | null;
  address: string | null;
  apartment: string | null;
  payment: PaymentMethod;
  comment: string | null;
  total: number;
  items: { name: string; qty: number; price: number }[];
};

const DELIVERY: Record<DeliveryMethod, string> = {
  COURIER: 'курьером',
  PICKUP: 'самовывоз',
};

const PAYMENT: Record<PaymentMethod, string> = {
  ON_DELIVERY: 'при получении',
  INSTALLMENT: 'рассрочка',
};

const money = (value: number) =>
  `${new Intl.NumberFormat('ru-RU').format(value)} ₸`;

/** Текст пользователя может содержать <, & — экранируем для parse_mode: HTML. */
const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Отправляет заказы в Telegram. Ошибки только логируются: оформление
 * заказа не должно падать из-за недоступного мессенджера.
 */
@Injectable()
export class OrderNotifier {
  private readonly logger = new Logger(OrderNotifier.name);

  constructor(
    private readonly settings: SettingsService,
    private readonly telegram: TelegramApi,
  ) {}

  async newOrder(order: NotifiableOrder) {
    try {
      const target = await this.settings.telegramTarget();
      if (!target) return;
      await this.telegram.sendMessage(
        target.token,
        target.chatId,
        this.format(order),
      );
    } catch (error) {
      this.logger.warn(
        `Заказ №${order.id}: уведомление не отправлено — ${String(error instanceof Error ? error.message : error)}`,
      );
    }
  }

  private format(order: NotifiableOrder) {
    const address = [order.city, order.address, order.apartment]
      .filter(Boolean)
      .join(', ');
    const lines = [
      `🛒 <b>Новый заказ №${order.id}</b>`,
      '',
      escape(order.customerName),
      escape(order.phone),
      ...(order.email ? [escape(order.email)] : []),
      '',
      ...order.items.map(
        (item) => `• ${escape(item.name)} — ${item.qty} × ${money(item.price)}`,
      ),
      '',
      `<b>Итого: ${money(order.total)}</b>`,
      `Доставка: ${DELIVERY[order.delivery]}${address ? `, ${escape(address)}` : ''}`,
      `Оплата: ${PAYMENT[order.payment]}`,
      ...(order.comment ? [`Комментарий: ${escape(order.comment)}`] : []),
    ];
    return lines.join('\n');
  }
}
