import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BuyBox } from "@/components/cart-buttons";
import { Gallery } from "@/components/gallery";
import { ShieldIcon, TruckIcon } from "@/components/icons";
import { ProductBadge, ProductGrid } from "@/components/product-card";
import { Container, SectionHeader, StockStatus } from "@/components/ui";
import { getProduct, getProducts } from "@/lib/api";
import { discountPercent, formatPrice, plural, serverNow } from "@/lib/format";
import { groupSpecs, toStored } from "@/lib/product";

// Один запрос на рендер — и для метаданных, и для страницы.
const loadProduct = cache(getProduct);

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await loadProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = await loadProduct((await params).slug);
  if (!product) notFound();

  const related = await getProducts({
    categorySlug: product.category.slug,
    limit: 5,
  });
  const relatedItems = related.items.filter((p) => p.id !== product.id).slice(0, 4);

  const stored = toStored(product);
  const discount = discountPercent(product.price, product.oldPrice);
  const specGroups = groupSpecs(product.specs);
  const now = serverNow();

  const extraSpecs = [
    product.warrantyMonths && {
      name: "Гарантия",
      value: `${product.warrantyMonths} ${plural(product.warrantyMonths, ["месяц", "месяца", "месяцев"])}`,
    },
    product.weightGrams && { name: "Вес", value: `${product.weightGrams} г` },
    { name: "Артикул", value: product.sku },
  ].filter((s): s is { name: string; value: string } => Boolean(s));

  return (
    <Container className="pt-8">
      <nav aria-label="Навигация" className="flex flex-wrap gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-fg">Главная</Link>
        <span aria-hidden>/</span>
        <Link href="/catalog" className="hover:text-fg">Каталог</Link>
        <span aria-hidden>/</span>
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-fg">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="relative lg:col-span-7">
          <Gallery
            images={product.images}
            name={product.name}
            categorySlug={product.category.slug}
          />
          <div className="pointer-events-none absolute top-4 right-4">
            <ProductBadge product={product} now={now} />
          </div>
        </div>

        <div className="lg:col-span-5">
          {product.brand && (
            <Link
              href={`/catalog?brand=${product.brand.slug}`}
              className="text-sm font-medium text-muted hover:text-fg"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-h1 font-semibold text-balance">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-3 text-base text-muted">{product.shortDescription}</p>
          )}

          <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-h1 font-semibold">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-h3 text-muted line-through">
                  {formatPrice(product.oldPrice!)}
                </span>
                <span className="text-sm font-semibold text-danger">
                  Экономия {formatPrice(product.oldPrice! - product.price)}
                </span>
              </>
            )}
          </div>
          <div className="mt-2">
            <StockStatus stock={product.stock} />
          </div>

          <div className="mt-8">
            <BuyBox product={stored} />
          </div>

          <ul className="mt-8 divide-y divide-border rounded-card border border-border">
            <li className="flex gap-3 p-4">
              <TruckIcon className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-sm font-semibold">Доставка по городу</p>
                <p className="text-sm text-muted">Курьером или самовывоз из магазина</p>
              </div>
            </li>
            {product.warrantyMonths ? (
              <li className="flex gap-3 p-4">
                <ShieldIcon className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="text-sm font-semibold">
                    Гарантия {product.warrantyMonths}{" "}
                    {plural(product.warrantyMonths, ["месяц", "месяца", "месяцев"])}
                  </p>
                  <p className="text-sm text-muted">Официальная гарантия производителя</p>
                </div>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <h2 className="text-h2 font-semibold">Описание</h2>
          <p className="mt-4 text-base leading-relaxed whitespace-pre-line text-fg/85">
            {product.description}
          </p>
        </section>

        <section id="specs" className="scroll-mt-24 lg:col-span-7">
          <h2 className="text-h2 font-semibold">Характеристики</h2>
          <div className="mt-4 space-y-8">
            {[...specGroups, ["Общие", extraSpecs] as const].map(([group, specs]) => (
              <div key={group}>
                <h3 className="mb-2 text-sm font-semibold text-muted">{group}</h3>
                <dl className="divide-y divide-border border-y border-border">
                  {specs.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 py-3 text-sm">
                      <dt className="text-muted">{s.name}</dt>
                      <dd className="font-medium">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      </div>

      {relatedItems.length > 0 && (
        <section className="mt-24">
          <SectionHeader title="С этим смотрят" />
          <ProductGrid products={relatedItems} now={now} />
        </section>
      )}
    </Container>
  );
}
