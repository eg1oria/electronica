import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, StatusDot } from "@/components/admin/ui";
import { adminGet, adminGetOrNull } from "@/lib/admin/session";
import { categoryTree } from "@/lib/admin/tree";
import type {
  AdminBrand,
  AdminCategory,
  AdminProduct,
} from "@/lib/admin/types";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Товар" };

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [product, categories, brands] = await Promise.all([
    adminGetOrNull<AdminProduct>(`/admin/products/${id}`),
    adminGet<AdminCategory[]>("/admin/categories"),
    adminGet<AdminBrand[]>("/admin/brands"),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={
          <>
            {product.sku} ·{" "}
            <StatusDot on={product.isActive} labels={["На витрине", "Скрыт"]} />
          </>
        }
        back={{ href: "/admin/products", label: "Товары" }}
      />
      <ProductForm
        product={product}
        categories={categoryTree(categories)}
        brands={brands}
      />
    </>
  );
}
