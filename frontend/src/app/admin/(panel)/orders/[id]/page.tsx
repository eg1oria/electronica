import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Card, PageHeader } from "@/components/admin/ui";
import { ProductMedia } from "@/components/product-media";
import {
  DELIVERY_LABELS,
  PAYMENT_LABELS,
  formatDate,
} from "@/lib/admin/orders";
import { adminGetOrNull } from "@/lib/admin/session";
import type { AdminOrder } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "../status-badge";
import { StatusControl } from "./status-control";

export async function generateMetadata({
  params,
}: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  return { title: `Заказ № ${(await params).id}` };
}

export default async function OrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const order = await adminGetOrNull<AdminOrder>(`/admin/orders/${id}`);
  if (!order) notFound();

  const address = [order.city, order.address, order.apartment && `кв./офис ${order.apartment}`]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title={`Заказ № ${order.id}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            от {formatDate(order.createdAt)}
          </span>
        }
        back={{ href: "/admin/orders", label: "Заказы" }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Card title="Товары">
            <ul className="-my-3 divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  <ProductMedia
                    src={item.product?.images[0]?.url ?? null}
                    alt=""
                    categorySlug={item.product?.category.slug ?? ""}
                    frame="size-12 shrink-0 bg-surface"
                    className="!rounded-btn"
                  />
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link
                        href={`/admin/products/${item.productId}`}
                        className="line-clamp-2 text-sm font-medium hover:text-accent"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium">
                        {item.name}{" "}
                        <span className="text-muted">(удалён из каталога)</span>
                      </p>
                    )}
                    <p className="text-xs text-muted">
                      {item.sku} · {formatPrice(item.price)} × {item.qty}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-semibold">Итого</span>
              <span className="text-h3 font-semibold tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </Card>

          <Card title="Покупатель">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Row label="Имя">{order.customerName}</Row>
              <Row label="Телефон">
                <a
                  href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
                  className="text-accent hover:underline"
                >
                  {order.phone}
                </a>
              </Row>
              {order.email && (
                <Row label="Email">
                  <a
                    href={`mailto:${order.email}`}
                    className="break-all text-accent hover:underline"
                  >
                    {order.email}
                  </a>
                </Row>
              )}
              <Row label="Получение">{DELIVERY_LABELS[order.delivery]}</Row>
              {address && <Row label="Адрес">{address}</Row>}
              <Row label="Оплата">{PAYMENT_LABELS[order.payment]}</Row>
              {order.comment && (
                <Row label="Комментарий" wide>
                  <span className="whitespace-pre-line">{order.comment}</span>
                </Row>
              )}
            </dl>
          </Card>
        </div>

        <div>
          <Card title="Статус" className="lg:sticky lg:top-6">
            <StatusControl id={order.id} status={order.status} />
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
