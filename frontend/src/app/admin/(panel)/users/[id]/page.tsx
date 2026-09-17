import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { adminGetOrNull, requireUser } from "@/lib/admin/session";
import { ROLE_LABELS, type AdminStaff } from "@/lib/admin/types";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "Сотрудник" };

export default async function EditUserPage({
  params,
}: PageProps<"/admin/users/[id]">) {
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const user = await adminGetOrNull<AdminStaff>(`/admin/users/${id}`);
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={user.name || user.login}
        description={ROLE_LABELS[user.role]}
        back={{ href: "/admin/users", label: "Сотрудники" }}
      />
      <UserForm user={user} self={user.id === me.id} />
    </>
  );
}
