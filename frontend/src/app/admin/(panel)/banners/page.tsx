import type { Metadata } from "next";
import Link from "next/link";
import { deleteBanner, toggleBanner } from "@/app/admin/actions";
import { DeleteButton, ServerSwitch } from "@/components/admin/controls";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { ButtonLink } from "@/components/ui";
import { adminGet } from "@/lib/admin/session";
import { MAX_BANNERS, type AdminBanner } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { MoveButtons } from "./move-buttons";

export const metadata: Metadata = { title: "Баннеры" };

export default async function BannersPage() {
  const banners = await adminGet<AdminBanner[]>("/admin/banners");
  const full = banners.length >= MAX_BANNERS;
  const ids = banners.map((b) => b.id);

  const addButton = full ? (
    <span className="text-sm text-muted">Добавлено максимум</span>
  ) : (
    <ButtonLink href="/admin/banners/new">
      <PlusIcon size={18} />
      Добавить
    </ButtonLink>
  );

  return (
    <>
      <PageHeader
        title="Баннеры"
        description={`Слайды на главной · ${banners.length} из ${MAX_BANNERS} · сменяются каждые 3 секунды`}
        action={addButton}
      />

      {banners.length === 0 ? (
        <EmptyState
          title="Баннеров пока нет"
          text="Пока их нет, на главной показывается хит продаж из ноутбуков."
          action={
            <ButtonLink href="/admin/banners/new">Добавить баннер</ButtonLink>
          }
        />
      ) : (
        <ol className="space-y-3">
          {banners.map((b, i) => {
            const p = b.product;
            const hidden = !b.isActive || !p.isActive;
            return (
              <li
                key={b.id}
                className={`flex items-center gap-4 rounded-card border border-border p-3 pr-4 transition-opacity ${hidden ? "opacity-60" : ""}`}
              >
                <MoveButtons ids={ids} index={i} />
                <Link
                  href={`/admin/banners/${b.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-4"
                >
                  <ProductMedia
                    src={b.image || p.images[0]?.url || null}
                    alt=""
                    categorySlug={p.category.slug}
                    frame="aspect-[4/3] w-20 shrink-0 bg-surface sm:w-28"
                    className="!rounded-btn"
                  />
                  <span className="min-w-0">
                    <span className="text-xs text-accent">
                      {b.badge || "Хит продаж"}
                    </span>
                    <span className="line-clamp-1 font-semibold group-hover:text-accent">
                      {b.title || p.name}
                    </span>
                    <span className="line-clamp-1 text-sm text-muted">
                      {p.isActive
                        ? `${p.name} · ${formatPrice(p.price)}`
                        : "Товар скрыт с витрины — слайд не показывается"}
                    </span>
                  </span>
                </Link>
                <ServerSwitch
                  checked={b.isActive}
                  label="Показывать на главной"
                  action={toggleBanner.bind(null, b.id)}
                />
                <DeleteButton
                  iconOnly
                  action={deleteBanner.bind(null, b.id, false)}
                  confirmText="Удалить этот баннер?"
                />
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
