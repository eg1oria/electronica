import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import {
  deleteProduct,
  toggleProduct,
  updateStock,
} from "@/app/admin/actions";
import {
  DeleteButton,
  ServerSwitch,
  StockInput,
} from "@/components/admin/controls";
import {
  EmptyState,
  PageHeader,
  Pager,
  Table,
  selectClass,
} from "@/components/admin/ui";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { Button, ButtonLink, inputClass } from "@/components/ui";
import { adminGet } from "@/lib/admin/session";
import { categoryTree, indentLabel } from "@/lib/admin/tree";
import type { AdminCategory, AdminProductList } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Товары" };

const PAGE_SIZE = 20;

const str = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || "";

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const filters = {
    search: str(sp.search).slice(0, 200),
    category: str(sp.category),
    status: str(sp.status),
    stock: str(sp.stock),
  };
  const page = Math.max(1, Math.floor(Number(str(sp.page)) || 1));

  const query = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: "newest",
  });
  if (filters.search) query.set("search", filters.search);
  if (/^\d+$/.test(filters.category)) query.set("categoryId", filters.category);
  if (filters.status === "active") query.set("isActive", "true");
  if (filters.status === "hidden") query.set("isActive", "false");
  if (filters.stock === "in") query.set("inStock", "true");
  if (filters.stock === "out") query.set("inStock", "false");

  const [data, categories] = await Promise.all([
    adminGet<AdminProductList>(`/admin/products?${query}`),
    adminGet<AdminCategory[]>("/admin/categories"),
  ]);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const filtered = Object.values(filters).some(Boolean);

  const pageHref = (p: number) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v),
    );
    if (p > 1) params.set("page", String(p));
    return `/admin/products${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Товары"
        description={`Всего: ${data.total}`}
        action={
          <ButtonLink href="/admin/products/new">
            <PlusIcon size={18} />
            Добавить
          </ButtonLink>
        }
      />

      <Form
        action="/admin/products"
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_160px_160px_auto]"
      >
        <div className="relative sm:col-span-2 lg:col-span-1">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="search"
            defaultValue={filters.search}
            placeholder="Название или артикул"
            aria-label="Поиск"
            maxLength={200}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          name="category"
          defaultValue={filters.category}
          aria-label="Категория"
          className={selectClass}
        >
          <option value="">Все категории</option>
          {categoryTree(categories).map((c) => (
            <option key={c.id} value={c.id}>
              {indentLabel(c)}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={filters.status}
          aria-label="Статус"
          className={selectClass}
        >
          <option value="">Любой статус</option>
          <option value="active">На витрине</option>
          <option value="hidden">Скрытые</option>
        </select>
        <select
          name="stock"
          defaultValue={filters.stock}
          aria-label="Наличие"
          className={selectClass}
        >
          <option value="">Любое наличие</option>
          <option value="in">В наличии</option>
          <option value="out">Нет в наличии</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" className="flex-1">
            Найти
          </Button>
          {filtered && (
            <ButtonLink href="/admin/products" variant="ghost">
              Сбросить
            </ButtonLink>
          )}
        </div>
      </Form>

      {data.items.length === 0 ? (
        <EmptyState
          title={filtered ? "Ничего не найдено" : "Товаров пока нет"}
          text={
            filtered
              ? "Попробуйте изменить условия поиска."
              : "Добавьте первый товар — он сразу появится в каталоге."
          }
          action={
            !filtered && (
              <ButtonLink href="/admin/products/new">Добавить товар</ButtonLink>
            )
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th className="!text-right">Цена</th>
              <th>Остаток</th>
              <th>Витрина</th>
              <th>Хит</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-surface/50">
                <td>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="group flex items-center gap-3"
                  >
                    <ProductMedia
                      src={p.images[0]?.url ?? null}
                      alt=""
                      categorySlug={p.category.slug}
                      frame="size-11 shrink-0 bg-surface"
                      className="!rounded-btn"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-medium group-hover:text-accent">
                        {p.name}
                      </span>
                      <span className="text-xs text-muted">{p.sku}</span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap text-muted">
                  {p.category.name}
                </td>
                <td className="text-right whitespace-nowrap tabular-nums">
                  {formatPrice(p.price)}
                  {p.oldPrice && (
                    <span className="block text-xs text-muted line-through">
                      {formatPrice(p.oldPrice)}
                    </span>
                  )}
                </td>
                <td>
                  <StockInput
                    value={p.stock}
                    action={updateStock.bind(null, p.id)}
                  />
                </td>
                <td>
                  <ServerSwitch
                    checked={p.isActive}
                    label="Показывать на витрине"
                    action={toggleProduct.bind(null, p.id, "isActive")}
                  />
                </td>
                <td>
                  <ServerSwitch
                    checked={p.isFeatured}
                    label="Хит продаж"
                    action={toggleProduct.bind(null, p.id, "isFeatured")}
                  />
                </td>
                <td>
                  <DeleteButton
                    iconOnly
                    action={deleteProduct.bind(null, p.id)}
                    confirmText={`Удалить «${p.name}»? Это действие нельзя отменить.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Pager page={page} pages={pages} href={pageHref} />
    </>
  );
}

