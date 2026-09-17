import type { ProductDetails, ProductListItem } from "./types";
import type { StoredProduct } from "./store";

const NEW_PRODUCT_DAYS = 30;

export function toStored(p: ProductListItem | ProductDetails): StoredProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.images[0]?.url ?? null,
    categorySlug: p.category.slug,
    stock: p.stock,
  };
}

export function isNew(createdAt: string, now: number) {
  return now - Date.parse(createdAt) < NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
}

/** Характеристики группами в порядке появления. */
export function groupSpecs(specs: ProductDetails["specs"]) {
  const groups = new Map<string, ProductDetails["specs"]>();
  for (const spec of specs) {
    const key = spec.group ?? "Основные";
    groups.set(key, [...(groups.get(key) ?? []), spec]);
  }
  return [...groups];
}
