import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { adminGet, adminGetOrNull } from "@/lib/admin/session";
import type { AdminBanner, AdminProductList } from "@/lib/admin/types";
import { BannerForm } from "../banner-form";

export const metadata: Metadata = { title: "Баннер" };

export default async function EditBannerPage({
  params,
}: PageProps<"/admin/banners/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [banner, products] = await Promise.all([
    adminGetOrNull<AdminBanner>(`/admin/banners/${id}`),
    adminGet<AdminProductList>("/admin/products?limit=100&sort=name"),
  ]);
  if (!banner) notFound();

  return (
    <>
      <PageHeader
        title={banner.title || banner.product.name}
        back={{ href: "/admin/banners", label: "Баннеры" }}
      />
      <BannerForm
        banner={banner}
        // Товар баннера мог не попасть в первые 100 — добавляем его в список
        products={
          products.items.some((p) => p.id === banner.productId)
            ? products.items
            : [banner.product, ...products.items]
        }
      />
    </>
  );
}
