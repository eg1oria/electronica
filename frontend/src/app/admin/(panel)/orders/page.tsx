import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { EmptyState, PageHeader, Pager, Table } from "@/components/admin/ui";
import { SearchIcon } from "@/components/icons";
import { Button, ButtonLink, inputClass } from "@/components/ui";
import {
  DELIVERY_LABELS,
  ORDER_STATUSES,
  formatDate,
  isOrderStatus,
} from "@/lib/admin/orders";
import { adminGet } from "@/lib/admin/session";
import type { AdminOrderList, OrderStats } from "@/lib/admin/types";
import { formatPrice, plural } from "@/lib/format";
import { StatusBadge } from "./status-badge";

export const metadata: Metadata = { title: "Заказы" };

const PAGE_SIZE = 20;

const str = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || "";

export default async function OrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = isOrderStatus(str(sp.status)) ? str(sp.status) : "";
  const search = str(sp.search).slice(0, 100);
  const page = Math.max(1, Math.floor(Number(str(sp.page)) || 1));

  const query = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (status) query.set("status", status);
  if (search) query.set("search", search);

  const [data, stats] = await Promise.all([
    adminGet<AdminOrderList>(`/admin/orders?${query}`),
    adminGet<OrderStats>("/admin/orders/stats"),
  ]);
  const all = Object.values(stats).reduce((sum, n) => sum + n, 0);
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const href = (patch: { status?: string; search?: string; page?: number }) => {
    const next = { status, search, page: 1, ...patch };
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.search) params.set("search", next.search);
    if (next.page > 1) params.set("page", String(next.page));
    return `/admin/orders${params.size ? `?${params}` : ""}`;
  };

  const tabs = [
    { value: "", label: "Все", count: all },
    ...ORDER_STATUSES.map((s) => ({
      value: s.value,
      label: s.label,
      count: stats[s.value],
    })),
  ];

  return (
    <>
      <PageHeader
        title="Заказы"
        description={
          stats.NEW
            ? `Новых: ${stats.NEW} — позвоните клиентам, чтобы подтвердить`
            : `Всего: ${all}`
        }
      />

      <nav
        aria-label="Статус"
        className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((t) => {
          const active = t.value === status;
          return (
            <Link
              key={t.value}
              href={href({ status: t.value })}
              aria-current={active ? "true" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-inverse text-inverse-fg"
                  : "bg-surface hover:bg-border"
              }`}
            >
              {t.label}
              <span className={active ? "opacity-70" : "text-muted"}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <Form action="/admin/orders" className="mb-6 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="№ заказа, имя, телефон или email"
            aria-label="Поиск"
            maxLength={100}
            className={`${inputClass} pl-9`}
          />
        </div>
        <Button type="submit" variant="secondary">
          Найти
        </Button>
        {search && (
          <ButtonLink href={href({ search: "" })} variant="ghost">
            Сбросить
          </ButtonLink>
        )}
      </Form>

      {data.items.length === 0 ? (
        <EmptyState
          title={search || status ? "Ничего не найдено" : "Заказов пока нет"}
          text={
            search || status
              ? "Попробуйте изменить условия поиска."
              : "Заказы из корзины магазина появятся здесь."
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Заказ</th>
              <th>Покупатель</th>
              <th>Получение</th>
              <th className="!text-right">Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => {
              const count = o.items.reduce((sum, i) => sum + i.qty, 0);
              return (
                <tr
                  key={o.id}
                  className="relative transition-colors hover:bg-surface/50"
                >
                  <td className="whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-semibold after:absolute after:inset-0 hover:text-accent"
                    >
                      № {o.id}
                    </Link>
                    <span className="block text-xs text-muted">
                      {formatDate(o.createdAt)}
                    </span>
                  </td>
                  <td>
                    <span className="line-clamp-1 font-medium">
                      {o.customerName}
                    </span>
                    <span className="text-xs whitespace-nowrap text-muted">
                      {o.phone}
                    </span>
                  </td>
                  <td className="text-muted">
                    <span className="block whitespace-nowrap">
                      {DELIVERY_LABELS[o.delivery]}
                    </span>
                    {o.city && (
                      <span className="line-clamp-1 text-xs">{o.city}</span>
                    )}
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">
                    {formatPrice(o.total)}
                    <span className="block text-xs text-muted">
                      {count} {plural(count, ["товар", "товара", "товаров"])}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Pager page={page} pages={pages} href={(p) => href({ page: p })} />
    </>
  );
}
