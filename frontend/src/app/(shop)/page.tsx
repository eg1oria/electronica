import Link from "next/link";
import { ArrowRightIcon, CategoryIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { ButtonLink, Container, SectionHeader } from "@/components/ui";
import { getBanners, getCategories, getProducts } from "@/lib/api";
import { serverNow } from "@/lib/format";
import type { Banner, ProductListItem } from "@/lib/types";

async function getPopular(): Promise<ProductListItem[]> {
  const featured = await getProducts({ isFeatured: true, limit: 4 });
  if (featured.items.length >= 4) return featured.items;
  // Хитов мало — добиваем новинками
  const newest = await getProducts({ sort: "newest", limit: 8 });
  const ids = new Set(featured.items.map((p) => p.id));
  return [...featured.items, ...newest.items.filter((p) => !ids.has(p.id))].slice(0, 4);
}

export default async function HomePage() {
  const [categories, popular, banners] = await Promise.all([
    getCategories(),
    getPopular(),
    getBanners(),
  ]);
  const slides = banners.length
    ? banners.map(bannerSlide)
    : await fallbackSlides(popular);
  const now = serverNow();

  return (
    <Container className="space-y-20 pt-6 sm:space-y-24 sm:pt-8">
      <h1 className="sr-only">NovaLink — электроника без лишнего</h1>
      <HeroSlider slides={slides} />

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

function bannerSlide(b: Banner): HeroSlide {
  const p = b.product;
  return {
    key: b.id,
    badge: b.badge || "Хит продаж",
    title: b.title || p.name,
    subtitle: b.subtitle || p.shortDescription || p.description,
    image: b.image || p.images[0]?.url || null,
    imageAlt: p.images[0]?.alt ?? p.name,
    categorySlug: p.category.slug,
    href: `/product/${p.slug}`,
    price: p.price,
    oldPrice: p.oldPrice,
  };
}

/** Пока баннеры не настроены в админке — хит из ноутбуков или популярный товар. */
async function fallbackSlides(popular: ProductListItem[]) {
  const laptops = await getProducts({
    isFeatured: true,
    categorySlug: "laptops",
    limit: 1,
  });
  const product = laptops.items[0] ?? popular[0];
  return product ? [productSlide(product)] : [];
}

function productSlide(p: ProductListItem): HeroSlide {
  return {
    key: p.id,
    badge: p.isFeatured ? "Хит продаж" : "Новинка",
    title: p.name,
    subtitle: p.shortDescription || p.description,
    image: p.images[0]?.url ?? null,
    imageAlt: p.images[0]?.alt ?? p.name,
    categorySlug: p.category.slug,
    href: `/product/${p.slug}`,
    price: p.price,
    oldPrice: p.oldPrice,
  };
}
