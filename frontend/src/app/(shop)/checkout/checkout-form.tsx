"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckIcon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { Button, ButtonLink, inputClass } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { cart, cartTotal, useHydrated, useStore } from "@/lib/store";
import type { DeliveryMethod, PaymentMethod } from "@/lib/types";
import { placeOrder } from "./actions";

const DELIVERY: { value: DeliveryMethod; title: string; note: string }[] = [
  { value: "COURIER", title: "Курьером", note: "1–2 дня, стоимость уточнит менеджер" },
  { value: "PICKUP", title: "Самовывоз", note: "Бесплатно, из магазина" },
];

const PAYMENT: { value: PaymentMethod; title: string; note: string }[] = [
  { value: "ON_DELIVERY", title: "При получении", note: "Картой или наличными" },
  { value: "INSTALLMENT", title: "Рассрочка", note: "Оформим после звонка менеджера" },
];

type Placed = { number: number; name: string; total: number };

export function CheckoutForm() {
  const hydrated = useHydrated();
  const items = useStore((s) => s.cart);
  const total = useStore(cartTotal);
  const [delivery, setDelivery] = useState<DeliveryMethod>("COURIER");
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!hydrated) return <div className="h-64" aria-busy="true" />;

  if (placed) {
    return (
      <div className="mx-auto mt-8 flex max-w-lg flex-col items-center rounded-card bg-surface px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon size={24} />
        </span>
        <h2 className="mt-5 text-h2 font-semibold">Спасибо, {placed.name}!</h2>
        <p className="mt-2 text-muted">
          Заказ № {placed.number} на {formatPrice(placed.total)} принят. Менеджер
          позвонит, чтобы подтвердить детали.
        </p>
        <ButtonLink href="/catalog" className="mt-8">
          Вернуться в каталог
        </ButtonLink>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
        <h2 className="text-h3 font-semibold">Корзина пуста</h2>
        <p className="mt-2 text-sm text-muted">Добавьте товары, чтобы оформить заказ.</p>
        <ButtonLink href="/catalog" className="mt-6">
          Перейти в каталог
        </ButtonLink>
      </div>
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const field = (key: string) => String(data.get(key) ?? "").trim();
    const courier = delivery === "COURIER";
    const name = field("name");

    setError(undefined);
    startTransition(async () => {
      const result = await placeOrder({
        customerName: name,
        phone: field("phone"),
        email: field("email") || null,
        delivery,
        city: courier ? field("city") : null,
        address: courier ? field("address") : null,
        apartment: courier ? field("apartment") || null : null,
        payment: field("payment") as PaymentMethod,
        comment: field("comment") || null,
        items: items.map((i) => ({ productId: i.id, qty: i.qty })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlaced({ number: result.id, name: name.split(/\s+/)[0], total: result.total });
      cart.clear();
      window.scrollTo({ top: 0 });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <Step n={1} title="Контакты">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя и фамилия" className="sm:col-span-2">
              <input
                name="name"
                required
                autoComplete="name"
                minLength={2}
                maxLength={100}
                className={inputClass}
              />
            </Field>
            <Field label="Телефон">
              <input
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="+7 ___ ___ __ __"
                pattern="[0-9\s\(\)\+\-]{10,20}"
                className={inputClass}
              />
            </Field>
            <Field label="Email" hint="Для чека и статуса заказа">
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                className={inputClass}
              />
            </Field>
          </div>
        </Step>

        <Step n={2} title="Получение">
          <div className="grid gap-3 sm:grid-cols-2">
            {DELIVERY.map((d) => (
              <OptionCard
                key={d.value}
                name="delivery"
                value={d.value}
                title={d.title}
                note={d.note}
                checked={delivery === d.value}
                onChange={() => setDelivery(d.value)}
              />
            ))}
          </div>
          {delivery === "COURIER" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-6">
              <Field label="Город" className="sm:col-span-2">
                <input
                  name="city"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="address-level2"
                  className={inputClass}
                />
              </Field>
              <Field label="Улица, дом" className="sm:col-span-4">
                <input
                  name="address"
                  required
                  minLength={3}
                  maxLength={300}
                  autoComplete="street-address"
                  className={inputClass}
                />
              </Field>
              <Field label="Квартира / офис" className="sm:col-span-2">
                <input name="apartment" maxLength={50} className={inputClass} />
              </Field>
            </div>
          )}
        </Step>

        <Step n={3} title="Оплата">
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYMENT.map((p, i) => (
              <OptionCard
                key={p.value}
                name="payment"
                value={p.value}
                title={p.title}
                note={p.note}
                defaultChecked={i === 0}
              />
            ))}
          </div>
          <Field label="Комментарий к заказу" className="mt-4">
            <textarea
              name="comment"
              rows={3}
              maxLength={500}
              className="w-full rounded-btn border border-border bg-bg px-3.5 py-3 text-base text-fg outline-none placeholder:text-muted focus:border-accent sm:text-sm"
            />
          </Field>
        </Step>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-card bg-surface p-6 lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <h2 className="text-h3 font-semibold">Ваш заказ</h2>
            <Link href="/cart" className="text-sm font-medium text-accent hover:underline">
              Изменить
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <ProductMedia
                  src={item.image}
                  alt=""
                  categorySlug={item.categorySlug}
                  frame="aspect-square bg-bg"
                  className="w-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-muted">{item.qty} шт.</p>
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold">Итого</span>
            <span className="text-h2 font-semibold">{formatPrice(total)}</span>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-btn bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="accent"
            size="lg"
            disabled={pending}
            className="mt-6 w-full"
          >
            {pending ? "Отправляем…" : "Подтвердить заказ"}
          </Button>
          <p className="mt-3 text-center text-sm text-muted">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных
          </p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 flex items-center gap-3 text-h3 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-full bg-inverse text-sm text-inverse-fg">
          {n}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

function OptionCard({
  title,
  note,
  ...input
}: {
  name: string;
  value: string;
  title: string;
  note: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-card border border-border p-4 transition-colors has-checked:border-accent has-checked:bg-accent/5">
      <input type="radio" className="mt-0.5 size-4 accent-accent" {...input} />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-sm text-muted">{note}</span>
      </span>
    </label>
  );
}
