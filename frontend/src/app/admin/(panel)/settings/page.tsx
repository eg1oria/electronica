import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { adminGet, requireUser } from "@/lib/admin/session";
import type { TelegramSettings } from "@/lib/admin/types";
import { PasswordForm } from "./password-form";
import { TelegramForm } from "./telegram-form";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const me = await requireUser();
  // Уведомления магазина настраивает администратор, пароль меняет каждый сам.
  const telegram =
    me.role === "ADMIN"
      ? await adminGet<TelegramSettings>("/admin/settings/telegram")
      : null;

  return (
    <>
      <PageHeader
        title="Настройки"
        description={`${me.name || me.login} · ${me.role === "ADMIN" ? "администратор" : "менеджер"}`}
      />
      <div className="max-w-2xl space-y-6">
        {telegram && <TelegramForm settings={telegram} />}
        <PasswordForm />
      </div>
    </>
  );
}
