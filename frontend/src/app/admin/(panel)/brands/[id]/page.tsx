import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { adminGetOrNull } from "@/lib/admin/session";
import type { AdminBrand } from "@/lib/admin/types";
import { BrandForm } from "../brand-form";

export const metadata: Metadata = { title: "Бренд" };

export default async function EditBrandPage({
  params,
}: PageProps<"/admin/brands/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const brand = await adminGetOrNull<AdminBrand>(`/admin/brands/${id}`);
  if (!brand) notFound();

  return (
    <>
      <PageHeader
        title={brand.name}
        back={{ href: "/admin/brands", label: "Бренды" }}
      />
      <BrandForm brand={brand} />
    </>
  );
}
