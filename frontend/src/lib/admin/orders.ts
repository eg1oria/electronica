import type { DeliveryMethod, OrderStatus, PaymentMethod } from "../types";

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  /** Классы бейджа статуса */
  tone: string;
}[] = [
  { value: "NEW", label: "Новый", tone: "bg-accent/10 text-accent" },
  { value: "CONFIRMED", label: "Подтверждён", tone: "bg-warning/15 text-warning" },
  { value: "SHIPPED", label: "Передан в доставку", tone: "bg-warning/15 text-warning" },
  { value: "COMPLETED", label: "Выполнен", tone: "bg-success/10 text-success" },
  { value: "CANCELLED", label: "Отменён", tone: "bg-surface text-muted" },
];

export const statusInfo = (status: OrderStatus) =>
  ORDER_STATUSES.find((s) => s.value === status)!;

export const isOrderStatus = (value: string): value is OrderStatus =>
  ORDER_STATUSES.some((s) => s.value === value);

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  COURIER: "Курьером",
  PICKUP: "Самовывоз",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  ON_DELIVERY: "При получении",
  INSTALLMENT: "Рассрочка",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Almaty",
});

/** «17 сент., 14:05» */
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
