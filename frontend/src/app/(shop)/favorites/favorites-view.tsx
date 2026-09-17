"use client";

import Link from "next/link";
import { AddToCartButton, FavoriteButton } from "@/components/cart-buttons";
import { ProductMedia } from "@/components/product-media";
import { ButtonLink } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";

export function FavoritesView() {
  const hydrated = useHydrated();
  const items = useStore((s) => s.favorites);

  if (!hydrated) return <div className="h-64" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
        <h2 className="text-h3 font-semibold">Здесь пока ничего нет</h2>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Нажмите на сердечко у товара, чтобы сохранить его на потом.
        </p>
        <ButtonLink href="/catalog" className="mt-6">
          Перейти в каталог
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[480px]:grid-cols-2 lg:grid-cols-4">
      {items.map((p) => (
        <article key={p.id} className="flex flex-col">
          <Link href={`/product/${p.slug}`} tabIndex={-1} aria-hidden>
            <ProductMedia src={p.image} alt={p.name} categorySlug={p.categorySlug} />
          </Link>
          <h3 className="mt-4 font-semibold">
            <Link href={`/product/${p.slug}`} className="hover:text-accent">
              {p.name}
            </Link>
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <span className="text-h3 font-semibold whitespace-nowrap">{formatPrice(p.price)}</span>
            <div className="flex items-center gap-2">
              <FavoriteButton product={p} />
              <AddToCartButton product={p} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
