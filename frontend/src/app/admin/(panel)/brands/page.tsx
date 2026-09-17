import type { Metadata } from "next";
import Link from "next/link";
import { deleteBrand } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/controls";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { PlusIcon, TagIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { adminGet } from "@/lib/admin/session";
import type { AdminBrand } from "@/lib/admin/types";
import { assetUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Бренды" };

export default async function BrandsPage() {
  const brands = await adminGet<AdminBrand[]>("/admin/brands");

  return (
    <>
      <PageHeader
        title="Бренды"
        description={`Всего: ${brands.length}`}
        action={
          <ButtonLink href="/admin/brands/new">
            <PlusIcon size={18} />
            Добавить
          </ButtonLink>
        }
      />
      {brands.length === 0 ? (
        <EmptyState
          title="Брендов пока нет"
          action={<ButtonLink href="/admin/brands/new">Добавить бренд</ButtonLink>}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th className="!text-right">Товаров</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => {
              const count = b._count?.products ?? 0;
              return (
                <tr key={b.id} className="transition-colors hover:bg-surface/50">
                  <td>
                    <Link
                      href={`/admin/brands/${b.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-btn bg-surface text-muted">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={assetUrl(b.logo)}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <TagIcon size={16} />
                        )}
                      </span>
                      <span className="font-medium group-hover:text-accent">
                        {b.name}
                      </span>
                    </Link>
                  </td>
                  <td className="text-muted">/{b.slug}</td>
                  <td className="text-right tabular-nums">{count}</td>
                  <td>
                    <DeleteButton
                      iconOnly
                      action={deleteBrand.bind(null, b.id)}
                      confirmText={
                        count
                          ? `Удалить бренд «${b.name}»? У ${count} товаров бренд будет убран.`
                          : `Удалить бренд «${b.name}»?`
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
