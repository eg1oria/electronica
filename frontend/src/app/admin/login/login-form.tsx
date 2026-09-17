"use client";

import { useActionState } from "react";
import { FormError, Field } from "@/components/admin/ui";
import { Button, inputClass } from "@/components/ui";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          maxLength={254}
          className={inputClass}
        />
      </Field>
      <Field label="Пароль">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={72}
          className={inputClass}
        />
      </Field>
      <FormError message={state?.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}
