import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/format";
import { isNew, toStored } from "@/lib/product";
import type { ProductListItem } from "@/lib/types";
import { AddToCartButton, FavoriteButton } from "./cart-buttons";
import { ProductMedia } from "./product-media";
import { Badge } from "./ui";

export function ProductBadge({
  product,
  now,
}: {
  product: Pick<ProductListItem, "price" | "oldPrice" | "createdAt" | "isFeatured">;
  now: number;
}) {
  const discount = discountPercent(product.price, product.oldPrice);
  if (discount > 0) return <Badge tone="danger">−{discount}%</Badge>;
  if (isNew(product.createdAt, now)) return <Badge tone="accent">Новинка</Badge>;
  if (product.isFeatured) return <Badge>Хит</Badge>;
  return null;
}

export function ProductCard({
  product,
  now,
  priority,
}: {
  product: ProductListItem;
  /** Текущее время с сервера — для бейджа «Новинка» */
  now: number;
  priority?: boolean;
}) {
  const stored = toStored(product);
  const href = `/product/${product.slug}`;
  const image = product.images[0];

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="relative block" tabIndex={-1} aria-hidden>
        <ProductMedia
          src={image?.url ?? null}
          alt={image?.alt ?? product.name}
          categorySlug={product.category.slug}
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <div className="absolute top-3 left-3">
          <ProductBadge product={product} now={now} />
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-base font-semibold">
          <Link href={href} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            <div className="text-h3 font-semibold whitespace-nowrap">
              {formatPrice(product.price)}
            </div>
            {product.oldPrice && product.oldPrice > product.price && (
              <div className="text-sm text-muted line-through">
                {formatPrice(product.oldPrice)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton product={stored} />
            <AddToCartButton product={stored} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  now,
  columns = 4,
}: {
  products: ProductListItem[];
  now: number;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-x-6 gap-y-10 min-[480px]:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} now={now} priority={i < 4} />
      ))}
    </div>
  );
}
