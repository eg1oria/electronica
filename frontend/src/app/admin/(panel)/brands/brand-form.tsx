"use client";

import { useActionState } from "react";
import { deleteBrand, saveBrand } from "@/app/admin/actions";
import {
  DeleteButton,
  ImageField,
  SubmitButton,
} from "@/components/admin/controls";
import { Card, Field, FormError, textareaClass } from "@/components/admin/ui";
import { inputClass } from "@/components/ui";
import type { AdminBrand } from "@/lib/admin/types";

export function BrandForm({ brand }: { brand?: AdminBrand }) {
  const [state, action] = useActionState(
    saveBrand.bind(null, brand?.id ?? null),
    undefined,
  );

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название">
            <input
              name="name"
              required
              maxLength={120}
              defaultValue={brand?.name}
              className={inputClass}
            />
          </Field>
          <Field label="Адрес (slug)" hint="Пусто — сгенерируем из названия">
            <input
              name="slug"
              maxLength={100}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Только a-z, 0-9 и дефисы"
              defaultValue={brand?.slug}
              placeholder="apple"
              className={inputClass}
            />
          </Field>
          <Field label="Описание" className="sm:col-span-2">
            <textarea
              name="description"
              rows={3}
              maxLength={5000}
              defaultValue={brand?.description ?? ""}
              className={textareaClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Логотип</span>
            <ImageField name="logo" defaultValue={brand?.logo ?? null} />
          </div>
        </div>
      </Card>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{brand ? "Сохранить" : "Создать бренд"}</SubmitButton>
        {brand && (
          <span className="ml-auto">
            <DeleteButton
              action={deleteBrand.bind(null, brand.id, true)}
              confirmText={`Удалить бренд «${brand.name}»? У его товаров бренд будет убран.`}
            />
          </span>
        )}
      </div>
    </form>
  );
}
