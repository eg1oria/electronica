import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/admin/session";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "Новый сотрудник" };

export default async function NewUserPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  return (
    <>
      <PageHeader
        title="Новый сотрудник"
        back={{ href: "/admin/users", label: "Сотрудники" }}
      />
      <UserForm />
    </>
  );
}
