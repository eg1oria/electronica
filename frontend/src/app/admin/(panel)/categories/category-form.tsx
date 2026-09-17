"use client";

import { useActionState } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import {
  DeleteButton,
  ImageField,
  SubmitButton,
} from "@/components/admin/controls";
import {
  Card,
  Field,
  FormError,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import { inputClass } from "@/components/ui";
import { indentLabel, type CategoryOption } from "@/lib/admin/tree";
import type { AdminCategory } from "@/lib/admin/types";

export function CategoryForm({
  category,
  parents,
}: {
  category?: AdminCategory;
  /** Категории, в которые можно вложить эту (без неё самой и потомков). */
  parents: CategoryOption[];
}) {
  const [state, action] = useActionState(
    saveCategory.bind(null, category?.id ?? null),
    undefined,
  );
  const busy =
    !!category && (category._count.products > 0 || category._count.children > 0);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название" className="sm:col-span-2">
            <input
              name="name"
              required
              maxLength={120}
              defaultValue={category?.name}
              className={inputClass}
            />
          </Field>
          <Field label="Адрес (slug)" hint="Пусто — сгенерируем из названия">
            <input
              name="slug"
              maxLength={100}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Только a-z, 0-9 и дефисы"
              defaultValue={category?.slug}
              placeholder="smartphones"
              className={inputClass}
            />
          </Field>
          <Field label="Родительская категория">
            <select
              name="parentId"
              defaultValue={category?.parentId ?? ""}
              className={selectClass}
            >
              <option value="">Нет (верхний уровень)</option>
              {parents.map((c) => (
                <option key={c.id} value={c.id}>
                  {indentLabel(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Описание" className="sm:col-span-2">
            <textarea
              name="description"
              rows={3}
              maxLength={5000}
              defaultValue={category?.description ?? ""}
              className={textareaClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Изображение</span>
            <ImageField name="image" defaultValue={category?.image ?? null} />
          </div>
        </div>
      </Card>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{category ? "Сохранить" : "Создать категорию"}</SubmitButton>
        {category && (
          <span className="ml-auto flex items-center gap-3">
            {busy && (
              <span className="text-xs text-muted">
                Удалить можно только пустую категорию
              </span>
            )}
            {!busy && (
              <DeleteButton
                action={deleteCategory.bind(null, category.id, true)}
                confirmText={`Удалить категорию «${category.name}»?`}
              />
            )}
          </span>
        )}
      </div>
    </form>
  );
}
