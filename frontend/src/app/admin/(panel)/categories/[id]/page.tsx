import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { adminGet } from "@/lib/admin/session";
import { categoryTree } from "@/lib/admin/tree";
import type { AdminCategory } from "@/lib/admin/types";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Категория" };

export default async function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  const all = categoryTree(await adminGet<AdminCategory[]>("/admin/categories"));
  const category = all.find((c) => String(c.id) === id);
  if (!category) notFound();

  // Нельзя вложить категорию в саму себя или в своих потомков:
  // в порядке дерева потомки идут сразу за ней с большей глубиной.
  const start = all.indexOf(category);
  let end = start + 1;
  while (end < all.length && all[end].depth > category.depth) end++;
  const parents = [...all.slice(0, start), ...all.slice(end)];

  return (
    <>
      <PageHeader
        title={category.name}
        description={`Товаров: ${category._count.products} · подкатегорий: ${category._count.children}`}
        back={{ href: "/admin/categories", label: "Категории" }}
      />
      <CategoryForm category={category} parents={parents} />
    </>
  );
}
