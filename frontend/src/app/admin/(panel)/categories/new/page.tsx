import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { adminGet } from "@/lib/admin/session";
import { categoryTree } from "@/lib/admin/tree";
import type { AdminCategory } from "@/lib/admin/types";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Новая категория" };

export default async function NewCategoryPage() {
  const categories = await adminGet<AdminCategory[]>("/admin/categories");
  return (
    <>
      <PageHeader
        title="Новая категория"
        back={{ href: "/admin/categories", label: "Категории" }}
      />
      <CategoryForm parents={categoryTree(categories)} />
    </>
  );
}
