"use client";

import { useActionState } from "react";
import { deleteStaff, saveStaff } from "@/app/admin/actions";
import { DeleteButton, SubmitButton } from "@/components/admin/controls";
import { Card, Field, FormError, selectClass } from "@/components/admin/ui";
import { inputClass } from "@/components/ui";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  ROLE_LABELS,
  type AdminStaff,
} from "@/lib/admin/types";

export function UserForm({
  user,
  self,
}: {
  user?: AdminStaff;
  /** Свою роль поменять нельзя — иначе можно случайно себя разжаловать. */
  self?: boolean;
}) {
  const [state, action] = useActionState(
    saveStaff.bind(null, user?.id ?? null),
    undefined,
  );

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Логин" hint="Латиница, цифры, точка, дефис">
            <input
              name="login"
              required
              minLength={3}
              maxLength={64}
              pattern="[a-zA-Z0-9]([a-zA-Z0-9._\-]*[a-zA-Z0-9])?"
              title="Латиница, цифры, точка, дефис и подчёркивание"
              autoComplete="username"
              defaultValue={user?.login}
              placeholder="manager"
              className={inputClass}
            />
          </Field>
          <Field label="Имя">
            <input
              name="name"
              maxLength={120}
              defaultValue={user?.name ?? ""}
              placeholder="Айдана"
              className={inputClass}
            />
          </Field>
          <Field
            label="Роль"
            hint={self ? "Свою роль меняет другой администратор" : undefined}
          >
            <select
              name="role"
              defaultValue={user?.role ?? "MANAGER"}
              disabled={self}
              className={`${selectClass} disabled:opacity-60`}
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {self && <input type="hidden" name="role" value={user?.role} />}
          </Field>
          <Field
            label={user ? "Новый пароль" : "Пароль"}
            hint={
              user
                ? "Пусто — пароль не меняется. Новый пароль закроет сессии сотрудника."
                : `Не короче ${MIN_PASSWORD_LENGTH} символов`
            }
          >
            <input
              type="password"
              name="password"
              required={!user}
              minLength={user ? undefined : MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{user ? "Сохранить" : "Добавить сотрудника"}</SubmitButton>
        {user && !self && (
          <span className="ml-auto">
            <DeleteButton
              action={deleteStaff.bind(null, user.id, true)}
              confirmText={`Удалить сотрудника «${user.name || user.login}»? Он потеряет доступ к админке.`}
            />
          </span>
        )}
      </div>
    </form>
  );
}
