import type { Metadata } from "next";
import Link from "next/link";
import { deleteCategory } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/controls";
import { EmptyState, PageHeader, Table } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { adminGet } from "@/lib/admin/session";
import { categoryTree } from "@/lib/admin/tree";
import type { AdminCategory } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Категории" };

export default async function CategoriesPage() {
  const categories = categoryTree(
    await adminGet<AdminCategory[]>("/admin/categories"),
  );

  return (
    <>
      <PageHeader
        title="Категории"
        description={`Всего: ${categories.length}`}
        action={
          <ButtonLink href="/admin/categories/new">
            <PlusIcon size={18} />
            Добавить
          </ButtonLink>
        }
      />
      {categories.length === 0 ? (
        <EmptyState
          title="Категорий пока нет"
          text="Создайте категорию — без неё нельзя добавить товар."
          action={
            <ButtonLink href="/admin/categories/new">Добавить категорию</ButtonLink>
          }
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
            {categories.map((c) => {
              const busy = c._count.products > 0 || c._count.children > 0;
              return (
                <tr key={c.id} className="transition-colors hover:bg-surface/50">
                  <td>
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="font-medium hover:text-accent"
                      style={{ paddingLeft: `${c.depth * 1.25}rem` }}
                    >
                      {c.depth > 0 && <span className="mr-1.5 text-muted">↳</span>}
                      {c.name}
                    </Link>
                  </td>
                  <td className="text-muted">/{c.slug}</td>
                  <td className="text-right tabular-nums">{c._count.products}</td>
                  <td>
                    {/* Удалить можно только пустую категорию */}
                    {!busy && (
                      <DeleteButton
                        iconOnly
                        action={deleteCategory.bind(null, c.id)}
                        confirmText={`Удалить категорию «${c.name}»?`}
                      />
                    )}
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
