"use server";

import { revalidatePath } from "next/cache";
import { API_URL, errorMessage } from "@/lib/api";
import type { DeliveryMethod, Order, PaymentMethod } from "@/lib/types";

export type OrderInput = {
  customerName: string;
  phone: string;
  email: string | null;
  delivery: DeliveryMethod;
  city: string | null;
  address: string | null;
  apartment: string | null;
  payment: PaymentMethod;
  comment: string | null;
  items: { productId: number; qty: number }[];
};

export type PlaceOrderResult =
  | { ok: true; id: number; total: number }
  | { ok: false; error: string };

/** Отправляет заказ в API. Цены и остатки проверяет бэкенд. */
export async function placeOrder(input: OrderInput): Promise<PlaceOrderResult> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  }).catch(() => null);

  if (!res) {
    return { ok: false, error: "Сервер недоступен. Попробуйте позже." };
  }
  if (res.status === 429) {
    return { ok: false, error: "Слишком много заказов подряд. Подождите минуту." };
  }
  if (!res.ok) return { ok: false, error: await errorMessage(res) };

  const order = (await res.json()) as Order;
  // Остатки изменились — обновляем витрину и админку.
  revalidatePath("/", "layout");
  return { ok: true, id: order.id, total: order.total };
}
