import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, StatusDot } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { adminGet, requireUser } from "@/lib/admin/session";
import type {
  AdminBrand,
  AdminCategory,
  AdminProductList,
  AdminProductListItem,
} from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Обзор" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [all, hidden, outOfStock, recent, categories, brands] =
    await Promise.all([
      adminGet<AdminProductList>("/admin/products?limit=1"),
      adminGet<AdminProductList>("/admin/products?isActive=false&limit=1"),
      adminGet<AdminProductList>("/admin/products?inStock=false&limit=5"),
      adminGet<AdminProductList>("/admin/products?sort=newest&limit=5"),
      adminGet<AdminCategory[]>("/admin/categories"),
      adminGet<AdminBrand[]>("/admin/brands"),
    ]);

  const stats = [
    { label: "Товаров", value: all.total, href: "/admin/products" },
    {
      label: "Скрыто с витрины",
      value: hidden.total,
      href: "/admin/products?status=hidden",
    },
    {
      label: "Нет в наличии",
      value: outOfStock.total,
      href: "/admin/products?stock=out",
    },
    { label: "Категорий", value: categories.length, href: "/admin/categories" },
    { label: "Брендов", value: brands.length, href: "/admin/brands" },
  ];

  return (
    <>
      <PageHeader
        title={`Здравствуйте${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Коротко о состоянии каталога."
        action={
          <ButtonLink href="/admin/products/new">
            <PlusIcon size={18} />
            Добавить товар
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-card bg-surface p-5 transition-opacity hover:opacity-80"
          >
            <p className="text-h1 font-semibold tabular-nums">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProductList
          title="Недавно добавленные"
          items={recent.items}
          empty="Товаров пока нет."
        />
        <ProductList
          title="Закончились"
          items={outOfStock.items}
          empty="Всё в наличии."
        />
      </div>
    </>
  );
}

function ProductList({
  title,
  items,
  empty,
}: {
  title: string;
  items: AdminProductListItem[];
  empty: string;
}) {
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="-my-3 divide-y divide-border">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="group flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-accent">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <StatusDot on={p.isActive} labels={["На витрине", "Скрыт"]} />
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums">
                  {formatPrice(p.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
