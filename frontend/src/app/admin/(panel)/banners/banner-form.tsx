"use client";

import { useActionState, useState } from "react";
import { deleteBanner, saveBanner } from "@/app/admin/actions";
import {
  DeleteButton,
  ImageField,
  SubmitButton,
  Switch,
} from "@/components/admin/controls";
import { Card, Field, FormError, selectClass } from "@/components/admin/ui";
import { inputClass } from "@/components/ui";
import type { AdminBanner } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";

export type BannerProductOption = Pick<
  AdminBanner["product"],
  "id" | "name" | "price" | "isActive" | "shortDescription" | "description"
>;

export function BannerForm({
  banner,
  products,
}: {
  banner?: AdminBanner;
  products: BannerProductOption[];
}) {
  const [state, action] = useActionState(
    saveBanner.bind(null, banner?.id ?? null),
    undefined,
  );
  const [productId, setProductId] = useState(
    String(banner?.productId ?? products[0]?.id ?? ""),
  );
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const product = products.find((p) => String(p.id) === productId);

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <Card>
        <div className="space-y-4">
          <Field
            label="Товар"
            hint="Кнопки «Купить» и «Подробнее» ведут на этот товар, цена берётся из него"
          >
            <select
              name="productId"
              required
              value={productId}
              onChange={(e) => setProductId(e.currentTarget.value)}
              className={selectClass}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.price)}
                  {p.isActive ? "" : " (скрыт)"}
                </option>
              ))}
            </select>
          </Field>

          <p className="text-sm text-muted">
            Пустые поля заполнятся из товара автоматически.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Метка">
              <input
                name="badge"
                maxLength={40}
                defaultValue={banner?.badge ?? ""}
                placeholder="Хит продаж"
                className={inputClass}
              />
            </Field>
            <Field label="Заголовок" className="sm:col-span-2">
              <input
                name="title"
                maxLength={120}
                defaultValue={banner?.title ?? ""}
                placeholder={product?.name}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Подзаголовок">
            <input
              name="subtitle"
              maxLength={300}
              defaultValue={banner?.subtitle ?? ""}
              placeholder={
                product?.shortDescription ?? product?.description ?? ""
              }
              className={inputClass}
            />
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium">
              Картинка
              <span className="ml-1.5 font-normal text-muted">
                — пусто: главное фото товара
              </span>
            </span>
            <ImageField name="image" defaultValue={banner?.image ?? null} />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Показывать на главной</p>
              <p className="text-xs text-muted">
                Выключенный слайд сохраняется, но не показывается
              </p>
            </div>
            <input
              type="hidden"
              name="isActive"
              value={isActive ? "on" : ""}
            />
            <Switch
              checked={isActive}
              label="Показывать на главной"
              onChange={setIsActive}
            />
          </div>
        </div>
      </Card>

      <FormError message={state?.error} />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{banner ? "Сохранить" : "Создать баннер"}</SubmitButton>
        {banner && (
          <span className="ml-auto">
            <DeleteButton
              action={deleteBanner.bind(null, banner.id, true)}
              confirmText="Удалить этот баннер?"
            />
          </span>
        )}
      </div>
    </form>
  );
}
