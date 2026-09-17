import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { BrandForm } from "../brand-form";

export const metadata: Metadata = { title: "Новый бренд" };

export default function NewBrandPage() {
  return (
    <>
      <PageHeader
        title="Новый бренд"
        back={{ href: "/admin/brands", label: "Бренды" }}
      />
      <BrandForm />
    </>
  );
}
