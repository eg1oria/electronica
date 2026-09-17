import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteStaff } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/controls";
import { PageHeader, Table } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { formatDate } from "@/lib/admin/orders";
import { adminGet, requireUser } from "@/lib/admin/session";
import { ROLE_LABELS, type AdminStaff } from "@/lib/admin/types";

export const metadata: Metadata = { title: "Сотрудники" };

export default async function UsersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") notFound();

  const staff = await adminGet<AdminStaff[]>("/admin/users");
  const admins = staff.filter((s) => s.role === "ADMIN").length;

  return (
    <>
      <PageHeader
        title="Сотрудники"
        description={`Всего: ${staff.length} · администраторов: ${admins}`}
        action={
          <ButtonLink href="/admin/users/new">
            <PlusIcon size={18} />
            Добавить
          </ButtonLink>
        }
      />
      <Table>
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Логин</th>
            <th>Роль</th>
            <th>Добавлен</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {staff.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-surface/50">
              <td>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {user.name || "Без имени"}
                </Link>
                {user.id === me.id && (
                  <span className="ml-2 text-xs text-muted">это вы</span>
                )}
              </td>
              <td className="text-muted">{user.login}</td>
              <td>{ROLE_LABELS[user.role]}</td>
              <td className="text-muted">{formatDate(user.createdAt)}</td>
              <td>
                {user.id !== me.id && (
                  <DeleteButton
                    iconOnly
                    action={deleteStaff.bind(null, user.id)}
                    confirmText={`Удалить сотрудника «${user.name || user.login}»? Он потеряет доступ к админке.`}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="mt-4 text-sm text-muted">
        Менеджер работает с каталогом и заказами. Администратор дополнительно
        управляет сотрудниками и настройками магазина.
      </p>
    </>
  );
}
