import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ChevronDownIcon, SlidersIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { Button, ButtonLink, Container, inputClass } from "@/components/ui";
import { getBrands, getCategories, getCategory, getProducts } from "@/lib/api";
import { formatPrice, plural, serverNow } from "@/lib/format";
import type { Brand, CategoryDetails, CategoryNode, ProductSort } from "@/lib/types";

const PAGE_SIZE = 12;

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Новинки" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "name", label: "По названию" },
];

type Filters = {
  category?: string;
  brand?: string;
  search?: string;
  min?: number;
  max?: number;
  stock?: boolean;
  sort: ProductSort;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const num = (v: string | string[] | undefined) => {
  const n = Number(str(v));
  return Number.isFinite(n) && n >= 0 && str(v) !== undefined ? n : undefined;
};

function parseFilters(sp: SearchParams): Filters {
  const sort = str(sp.sort) as ProductSort | undefined;
  const page = Math.floor(num(sp.page) ?? 1);
  let min = num(sp.min);
  let max = num(sp.max);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return {
    category: str(sp.category),
    brand: str(sp.brand),
    search: str(sp.search)?.slice(0, 200),
    min,
    max,
    stock: str(sp.stock) === "1" || undefined,
    sort: SORTS.some((s) => s.value === sort) ? sort! : "newest",
    page: page >= 1 ? page : 1,
  };
}

/** Ссылка на каталог с изменёнными фильтрами; смена фильтра сбрасывает страницу. */
function catalogHref(f: Filters, patch: Partial<Filters>) {
  const next = { ...f, page: 1, ...patch };
  const params = new URLSearchParams();
  if (next.category) params.set("category", next.category);
  if (next.search) params.set("search", next.search);
  if (next.brand) params.set("brand", next.brand);
  if (next.min !== undefined) params.set("min", String(next.min));
  if (next.max !== undefined) params.set("max", String(next.max));
  if (next.stock) params.set("stock", "1");
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  return params.size ? `/catalog?${params}` : "/catalog";
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/catalog">): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  if (f.search) return { title: `Поиск: ${f.search}` };
  const category = f.category ? await getCategory(f.category) : null;
  return { title: category?.name ?? "Каталог" };
}

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const f = parseFilters(await searchParams);

  const [category, categories, brands, result] = await Promise.all([
    f.category ? getCategory(f.category) : null,
    getCategories(),
    getBrands(),
    getProducts({
      search: f.search,
      categorySlug: f.category,
      brandSlug: f.brand,
      minPrice: f.min,
      maxPrice: f.max,
      inStock: f.stock,
      sort: f.sort,
      page: f.page,
      limit: PAGE_SIZE,
    }),
  ]);
  if (f.category && !category) notFound();

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const title = f.search
    ? `Результаты по запросу «${f.search}»`
    : (category?.name ?? "Каталог");
  const activeFilters = Boolean(f.brand || f.min !== undefined || f.max !== undefined || f.stock);

  return (
    <Container className="pt-8">
      <Breadcrumbs category={category} />

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-h1 font-semibold">{title}</h1>
        <span className="text-sm text-muted">
          {result.total} {plural(result.total, ["товар", "товара", "товаров"])}
        </span>
      </div>

      {category && category.children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link
              key={c.id}
              href={catalogHref(f, { category: c.slug })}
              className="rounded-full bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <details className="group lg:hidden" open={activeFilters || undefined}>
            <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-btn border border-border px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <SlidersIcon size={16} /> Фильтры
                {activeFilters && <span className="size-1.5 rounded-full bg-accent" />}
              </span>
              <ChevronDownIcon size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="pt-6">
              <FiltersPanel f={f} categories={categories} brands={brands} />
            </div>
          </details>
          <div className="hidden lg:block">
            <FiltersPanel f={f} categories={categories} brands={brands} />
          </div>
        </aside>

        <section className="min-w-0 lg:col-span-9">
          <nav aria-label="Сортировка" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {SORTS.map((s) => {
              const active = s.value === f.sort;
              return (
                <Link
                  key={s.value}
                  href={catalogHref(f, { sort: s.value })}
                  aria-current={active ? "true" : undefined}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-inverse text-inverse-fg" : "bg-surface hover:bg-border"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </nav>

          {result.items.length > 0 ? (
            <ProductGrid
              products={result.items}
              now={serverNow()}
              columns={3}
            />
          ) : (
            <div className="flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
              <h2 className="text-h3 font-semibold">Ничего не нашлось</h2>
              <p className="mt-2 max-w-sm text-sm text-muted">
                Попробуйте изменить запрос или сбросить фильтры.
              </p>
              <ButtonLink href="/catalog" variant="secondary" className="mt-6">
                Весь каталог
              </ButtonLink>
            </div>
          )}

          {pages > 1 && <Pagination f={f} pages={pages} />}
        </section>
      </div>
    </Container>
  );
}

function Breadcrumbs({ category }: { category: CategoryDetails | null }) {
  const crumbs = [{ href: "/", label: "Главная" }, { href: "/catalog", label: "Каталог" }];
  if (category?.parent) {
    crumbs.push({ href: `/catalog?category=${category.parent.slug}`, label: category.parent.name });
  }
  return (
    <nav aria-label="Навигация" className="flex flex-wrap gap-1.5 text-sm text-muted">
      {crumbs.map((c, i) => (
        <span key={c.href} className="inline-flex gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          <Link href={c.href} className="hover:text-fg">
            {c.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function FiltersPanel({
  f,
  categories,
  brands,
}: {
  f: Filters;
  categories: CategoryNode[];
  brands: Brand[];
}) {
  const flat = (nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] =>
    nodes.flatMap((node) => [{ node, depth }, ...flat(node.children, depth + 1)]);
  // API считает только товары самой категории — добавляем подкатегории.
  const total = (node: CategoryNode): number =>
    node.productsCount + node.children.reduce((sum, c) => sum + total(c), 0);

  return (
    <div className="space-y-8">
      <FilterGroup title="Категория">
        <ul className="space-y-1">
          <li>
            <FilterLink href={catalogHref(f, { category: undefined })} active={!f.category}>
              Все товары
            </FilterLink>
          </li>
          {flat(categories).map(({ node, depth }) => (
            <li key={node.id} style={{ paddingLeft: depth * 12 }}>
              <FilterLink
                href={catalogHref(f, { category: node.slug })}
                active={f.category === node.slug}
              >
                {node.name}
                <span className="ml-auto text-muted">{total(node)}</span>
              </FilterLink>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {/* key сбрасывает поля формы при смене фильтров по ссылкам */}
      <Form action="/catalog" className="space-y-8" key={catalogHref(f, {})}>
        {f.category && <input type="hidden" name="category" value={f.category} />}
        {f.search && <input type="hidden" name="search" value={f.search} />}
        {f.sort !== "newest" && <input type="hidden" name="sort" value={f.sort} />}

        {brands.length > 0 && (
          <FilterGroup title="Бренд">
            <div className="space-y-2.5">
              <Radio name="brand" value="" label="Любой" defaultChecked={!f.brand} />
              {brands.map((b) => (
                <Radio
                  key={b.id}
                  name="brand"
                  value={b.slug}
                  label={b.name}
                  defaultChecked={f.brand === b.slug}
                />
              ))}
            </div>
          </FilterGroup>
        )}

        <FilterGroup title="Цена, ₸">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="min"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="от"
              aria-label="Цена от"
              defaultValue={f.min}
              className={inputClass}
            />
            <input
              type="number"
              name="max"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="до"
              aria-label="Цена до"
              defaultValue={f.max}
              className={inputClass}
            />
          </div>
          {(f.min !== undefined || f.max !== undefined) && (
            <p className="mt-2 text-sm text-muted">
              {f.min !== undefined && `от ${formatPrice(f.min)} `}
              {f.max !== undefined && `до ${formatPrice(f.max)}`}
            </p>
          )}
        </FilterGroup>

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={f.stock}
            className="size-4 accent-accent"
          />
          Только в наличии
        </label>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Показать
          </Button>
          <ButtonLink
            href={catalogHref(f, { brand: undefined, min: undefined, max: undefined, stock: undefined })}
            variant="secondary"
          >
            Сбросить
          </ButtonLink>
        </div>
      </Form>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex items-center gap-2 rounded-btn px-2.5 py-1.5 text-sm transition-colors ${
        active ? "bg-surface font-semibold" : "hover:bg-surface"
      }`}
    >
      {children}
    </Link>
  );
}

function Radio({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 accent-accent"
      />
      {label}
    </label>
  );
}

function Pagination({ f, pages }: { f: Filters; pages: number }) {
  const items = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - f.page) <= 1,
  );
  return (
    <nav aria-label="Страницы" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {items.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - items[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link
            href={catalogHref(f, { page: p })}
            aria-current={p === f.page ? "page" : undefined}
            className={`flex size-10 items-center justify-center rounded-btn text-sm font-semibold transition-colors ${
              p === f.page ? "bg-inverse text-inverse-fg" : "hover:bg-surface"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
