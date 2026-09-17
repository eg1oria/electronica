import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { adminGet } from "@/lib/admin/session";
import { categoryTree } from "@/lib/admin/tree";
import type { AdminBrand, AdminCategory } from "@/lib/admin/types";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Новый товар" };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    adminGet<AdminCategory[]>("/admin/categories"),
    adminGet<AdminBrand[]>("/admin/brands"),
  ]);

  return (
    <>
      <PageHeader
        title="Новый товар"
        back={{ href: "/admin/products", label: "Товары" }}
      />
      <ProductForm categories={categoryTree(categories)} brands={brands} />
    </>
  );
}
