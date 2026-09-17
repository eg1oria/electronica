"use client";

import Link from "next/link";
import { useState } from "react";
import { cart, cartCount, favorites, useStore, type StoredProduct } from "@/lib/store";
import { CartIcon, CheckIcon, HeartIcon, MinusIcon, PlusIcon } from "./icons";
import { Button, buttonClass } from "./ui";

export function AddToCartButton({
  product,
  size = "sm",
  label = "В корзину",
  className = "",
}: {
  product: StoredProduct;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const inCart = useStore((s) => s.cart.some((i) => i.id === product.id));

  if (product.stock <= 0) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        Нет в наличии
      </Button>
    );
  }

  if (inCart) {
    return (
      <Link
        href="/cart"
        className={`${buttonClass("secondary", size)} ${className}`}
      >
        <CheckIcon size={16} />
        В корзине
      </Link>
    );
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={() => cart.add(product)}
    >
      {label}
    </Button>
  );
}

/** Кнопка «В корзину» с выбором количества — для страницы товара. */
export function BuyBox({ product }: { product: StoredProduct }) {
  const [qty, setQty] = useState(1);
  const inCart = useStore((s) => s.cart.find((i) => i.id === product.id));
  const max = Math.min(product.stock, 99);

  if (product.stock <= 0) {
    return (
      <div className="flex gap-3">
        <Button size="lg" variant="secondary" disabled className="flex-1 sm:flex-none">
          Нет в наличии
        </Button>
        <FavoriteButton product={product} large />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        <QtyStepper value={qty} max={max} onChange={setQty} size="lg" />
        <Button
          variant="accent"
          size="lg"
          className="flex-1 sm:w-48 sm:flex-none"
          onClick={() => cart.add(product, qty)}
        >
          <CartIcon size={18} />
          В корзину
        </Button>
        <FavoriteButton product={product} large />
      </div>
      {inCart && (
        <Link
          href="/cart"
          className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
        >
          В корзине: {inCart.qty} шт. — перейти
        </Link>
      )}
    </div>
  );
}

export function QtyStepper({
  value,
  max,
  onChange,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (qty: number) => void;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-12" : "h-9";
  const btn = `flex ${h} w-10 items-center justify-center text-fg transition-colors hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent`;
  return (
    <div className={`inline-flex ${h} items-center overflow-hidden rounded-btn border border-border`}>
      <button
        type="button"
        className={btn}
        aria-label="Уменьшить количество"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon size={16} />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="Увеличить количество"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

export function FavoriteButton({
  product,
  large,
}: {
  product: StoredProduct;
  large?: boolean;
}) {
  const active = useStore((s) => s.favorites.some((f) => f.id === product.id));
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "В избранное"}
      onClick={() => favorites.toggle(product)}
      className={`inline-flex shrink-0 items-center justify-center rounded-btn border border-border transition-colors hover:bg-surface ${large ? "size-12" : "size-9"} ${active ? "text-danger" : "text-fg"}`}
    >
      <HeartIcon size={large ? 20 : 16} filled={active} />
    </button>
  );
}

export function HeaderCartLink() {
  const count = useStore(cartCount);
  return (
    <Link
      href="/cart"
      aria-label={`Корзина, товаров: ${count}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-inverse px-3 text-sm font-semibold text-inverse-fg transition-opacity hover:opacity-85"
    >
      <CartIcon size={18} />
      <span className="tabular-nums">{count}</span>
    </Link>
  );
}

export function HeaderFavoritesLink() {
  const count = useStore((s) => s.favorites.length);
  return (
    <Link
      href="/favorites"
      aria-label={`Избранное, товаров: ${count}`}
      className="relative inline-flex size-9 items-center justify-center rounded-btn transition-colors hover:bg-surface"
    >
      <HeartIcon size={20} />
      {count > 0 && (
        <span className="absolute top-1 right-1 size-2 rounded-full bg-accent" />
      )}
    </Link>
  );
}
