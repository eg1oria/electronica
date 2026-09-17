import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui";
import { adminGet } from "@/lib/admin/session";
import {
  MAX_BANNERS,
  type AdminBanner,
  type AdminProductList,
} from "@/lib/admin/types";
import { BannerForm } from "../banner-form";

export const metadata: Metadata = { title: "Новый баннер" };

export default async function NewBannerPage() {
  const [banners, products] = await Promise.all([
    adminGet<AdminBanner[]>("/admin/banners"),
    adminGet<AdminProductList>("/admin/products?limit=100&sort=name"),
  ]);
  if (banners.length >= MAX_BANNERS) redirect("/admin/banners");

  return (
    <>
      <PageHeader
        title="Новый баннер"
        back={{ href: "/admin/banners", label: "Баннеры" }}
      />
      {products.items.length === 0 ? (
        <EmptyState
          title="Сначала добавьте товар"
          text="Баннер ведёт на товар и показывает его цену."
          action={
            <ButtonLink href="/admin/products/new">Добавить товар</ButtonLink>
          }
        />
      ) : (
        <BannerForm products={products.items} />
      )}
    </>
  );
}
