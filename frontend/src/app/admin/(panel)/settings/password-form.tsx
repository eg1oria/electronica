"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPassword } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/controls";
import { Card, Field, FormError } from "@/components/admin/ui";
import { inputClass } from "@/components/ui";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/lib/admin/types";

export function PasswordForm() {
  const [state, action] = useActionState(changeOwnPassword, undefined);
  const form = useRef<HTMLFormElement>(null);

  // Пароль сменён — очищаем поля, чтобы они не остались заполненными.
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state?.ok]);

  return (
    <Card title="Смена пароля">
      <p className="text-sm text-muted">
        После смены пароля вход на других устройствах закроется, а эта сессия
        продолжит работать.
      </p>
      <form ref={form} action={action} className="mt-6 max-w-md space-y-4">
        <Field label="Текущий пароль">
          <input
            type="password"
            name="currentPassword"
            required
            maxLength={MAX_PASSWORD_LENGTH}
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <Field
          label="Новый пароль"
          hint={`Не короче ${MIN_PASSWORD_LENGTH} символов`}
        >
          <input
            type="password"
            name="newPassword"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Новый пароль ещё раз">
          <input
            type="password"
            name="repeatPassword"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>

        <FormError message={state?.error} />
        {state?.ok && (
          <p className="rounded-btn bg-success/10 px-3.5 py-2.5 text-sm text-success">
            Пароль изменён
          </p>
        )}

        <SubmitButton>Сменить пароль</SubmitButton>
      </form>
    </Card>
  );
}
