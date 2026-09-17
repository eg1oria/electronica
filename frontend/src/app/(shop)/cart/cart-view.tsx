"use client";

import Link from "next/link";
import { QtyStepper } from "@/components/cart-buttons";
import { TrashIcon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { ButtonLink } from "@/components/ui";
import { formatPrice, plural } from "@/lib/format";
import { cart, cartCount, cartTotal, useHydrated, useStore } from "@/lib/store";

export function CartView() {
  const hydrated = useHydrated();
  const items = useStore((s) => s.cart);
  const count = useStore(cartCount);
  const total = useStore(cartTotal);

  if (!hydrated) return <div className="h-64" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
        <h2 className="text-h3 font-semibold">В корзине пока пусто</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Загляните в каталог — там есть из чего выбрать.
        </p>
        <ButtonLink href="/catalog" className="mt-6">
          Перейти в каталог
        </ButtonLink>
      </div>
    );
  }

  const savings = items.reduce(
    (sum, i) => sum + (i.oldPrice && i.oldPrice > i.price ? (i.oldPrice - i.price) * i.qty : 0),
    0,
  );

  return (
    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
      <ul className="divide-y divide-border self-start border-y border-border lg:col-span-8">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-5 sm:gap-6">
            <Link href={`/product/${item.slug}`} className="w-24 shrink-0 sm:w-28">
              <ProductMedia src={item.image} alt={item.name} categorySlug={item.categorySlug} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link href={`/product/${item.slug}`} className="font-semibold hover:text-accent">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{formatPrice(item.price)} за шт.</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <span className="text-h3 font-semibold whitespace-nowrap">
                  {formatPrice(item.price * item.qty)}
                </span>
                <div className="flex items-center gap-2">
                  <QtyStepper
                    value={item.qty}
                    max={Math.min(item.stock, 99)}
                    onChange={(q) => cart.setQty(item.id, q)}
                  />
                  <button
                    type="button"
                    onClick={() => cart.remove(item.id)}
                    aria-label={`Удалить ${item.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-danger"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:col-span-4">
        <div className="rounded-card bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="text-h3 font-semibold">Ваш заказ</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">
                {count} {plural(count, ["товар", "товара", "товаров"])}
              </dt>
              <dd>{formatPrice(total + savings)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Скидка</dt>
                <dd className="text-danger">−{formatPrice(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Доставка</dt>
              <dd>Рассчитаем при оформлении</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-semibold">Итого</span>
            <span className="text-h2 font-semibold">{formatPrice(total)}</span>
          </div>
          <ButtonLink href="/checkout" variant="accent" size="lg" className="mt-6 w-full">
            Перейти к оформлению
          </ButtonLink>
          <button
            type="button"
            onClick={() => cart.clear()}
            className="mt-3 w-full text-center text-sm text-muted hover:text-fg"
          >
            Очистить корзину
          </button>
        </div>
      </aside>
    </div>
  );
}
