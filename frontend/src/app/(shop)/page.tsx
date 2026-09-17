import Link from "next/link";
import { ArrowRightIcon, CategoryIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { ProductMedia } from "@/components/product-media";
import { Badge, ButtonLink, Container, SectionHeader } from "@/components/ui";
import { getCategories, getProducts } from "@/lib/api";
import { formatPrice, serverNow } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

async function getPopular(): Promise<ProductListItem[]> {
  const featured = await getProducts({ isFeatured: true, limit: 4 });
  if (featured.items.length >= 4) return featured.items;
  // Хитов мало — добиваем новинками
  const newest = await getProducts({ sort: "newest", limit: 8 });
  const ids = new Set(featured.items.map((p) => p.id));
  return [...featured.items, ...newest.items.filter((p) => !ids.has(p.id))].slice(0, 4);
}

export default async function HomePage() {
  const [categories, popular, heroList] = await Promise.all([
    getCategories(),
    getPopular(),
    getProducts({ isFeatured: true, categorySlug: "laptops", limit: 1 }),
  ]);
  const hero = heroList.items[0] ?? popular[0];
  const now = serverNow();

  return (
    <Container className="space-y-20 pt-6 sm:space-y-24 sm:pt-8">
      {hero && <Hero product={hero} />}

      {categories.length > 0 && (
        <section>
          <SectionHeader title="Категории" />
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          >
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/catalog?category=${c.slug}`}
                className="flex flex-col items-center justify-center gap-3 rounded-card bg-surface px-4 py-8 text-center transition-colors hover:bg-border/60"
              >
                <CategoryIcon slug={c.slug} size={28} strokeWidth={1.4} />
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section>
          <SectionHeader
            title="Популярное"
            action={
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
              >
                Смотреть все <ArrowRightIcon size={16} />
              </Link>
            }
          />
          <ProductGrid products={popular} now={now} />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start rounded-card bg-[#0b0b0c] p-8 text-white ring-1 ring-white/10 sm:p-10">
          <span className="text-sm font-medium text-[#4d94ff]">Трейд-ин</span>
          <h2 className="mt-3 max-w-md text-h2 font-semibold sm:text-[1.75rem] sm:leading-tight">
            Сдайте старый смартфон — получите скидку на новый
          </h2>
          <Link
            href="/help#trade-in"
            className="mt-8 inline-flex h-11 items-center rounded-btn bg-white px-5 text-sm font-semibold text-[#111] transition-opacity hover:opacity-85"
          >
            Оценить устройство
          </Link>
        </div>
        <div className="flex flex-col items-start rounded-card bg-surface p-8 sm:p-10">
          <span className="text-sm font-medium text-accent">Рассрочка</span>
          <h2 className="mt-3 max-w-md text-h2 font-semibold sm:text-[1.75rem] sm:leading-tight">
            Техника сейчас, оплата частями — без переплат
          </h2>
          <ButtonLink href="/help#delivery" className="mt-8">
            Условия
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}

function Hero({ product }: { product: ProductListItem }) {
  const href = `/product/${product.slug}`;
  return (
    <section className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-card bg-surface p-6 sm:p-10 md:grid-cols-12 lg:p-14">
      <div className="md:col-span-6">
        <Badge tone="neutral">{product.isFeatured ? "Хит продаж" : "Новинка"}</Badge>
        <h1 className="mt-5 text-h1 font-semibold text-balance sm:text-display">
          {product.name}
        </h1>
        <p className="mt-4 max-w-md text-base text-muted">
          {product.description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={href} variant="accent" size="lg">
            Купить за {formatPrice(product.price)}
          </ButtonLink>
          <ButtonLink href={`${href}#specs`} variant="secondary" size="lg">
            Подробнее
          </ButtonLink>
        </div>
      </div>
      <div className="md:col-span-6">
        <ProductMedia
          src={product.images[0]?.url ?? null}
          alt={product.images[0]?.alt ?? product.name}
          categorySlug={product.category.slug}
          priority
          frame="aspect-[4/3]"
        />
      </div>
    </section>
  );
}
