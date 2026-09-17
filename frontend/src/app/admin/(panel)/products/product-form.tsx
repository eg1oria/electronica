"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import {
  deleteProduct,
  saveProduct,
  type ProductInput,
} from "@/app/admin/actions";
import {
  DeleteButton,
  IMAGE_ACCEPT,
  Switch,
  useUpload,
} from "@/components/admin/controls";
import {
  Card,
  Field,
  FormError,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/icons";
import { Button, inputClass } from "@/components/ui";
import { indentLabel, type CategoryOption } from "@/lib/admin/tree";
import type { AdminBrand, AdminProduct } from "@/lib/admin/types";
import { assetUrl } from "@/lib/format";

type Image = { key: string; url: string; alt: string | null };
type Spec = { key: string; name: string; value: string; group: string };

const newKey = () => crypto.randomUUID();

const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();

const numberOrNull = (data: FormData, key: string) => {
  const value = text(data, key).replace(",", ".");
  return value ? Number(value) : null;
};

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: AdminProduct;
  categories: CategoryOption[];
  brands: AdminBrand[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; saved?: boolean }>();
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [images, setImages] = useState<Image[]>(
    product?.images.map((i) => ({ key: newKey(), url: i.url, alt: i.alt })) ??
      [],
  );
  const [specs, setSpecs] = useState<Spec[]>(
    product?.specs.map((s) => ({
      key: newKey(),
      name: s.name,
      value: s.value,
      group: s.group ?? "",
    })) ?? [],
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const input: ProductInput = {
      name: text(data, "name"),
      slug: text(data, "slug") || undefined,
      sku: text(data, "sku"),
      shortDescription: text(data, "shortDescription") || null,
      description: text(data, "description"),
      price: numberOrNull(data, "price") ?? 0,
      oldPrice: numberOrNull(data, "oldPrice"),
      stock: numberOrNull(data, "stock") ?? 0,
      isActive,
      isFeatured,
      warrantyMonths: numberOrNull(data, "warrantyMonths"),
      weightGrams: numberOrNull(data, "weightGrams"),
      categoryId: Number(text(data, "categoryId")),
      brandId: numberOrNull(data, "brandId"),
      images: images.map(({ url, alt }) => ({ url, alt: alt?.trim() || null })),
      specs: specs
        .filter((s) => s.name.trim() && s.value.trim())
        .map((s) => ({
          name: s.name.trim(),
          value: s.value.trim(),
          group: s.group.trim() || null,
        })),
    };
    setResult(undefined);
    startTransition(async () => {
      const res = await saveProduct(product?.id ?? null, input);
      setResult(res?.error ? { error: res.error } : { saved: true });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => result?.saved && setResult(undefined)}
      className="grid gap-6 lg:grid-cols-12"
    >
      <div className="space-y-6 lg:col-span-8">
        <Card title="Основное">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название" className="sm:col-span-2">
              <input
                name="name"
                required
                maxLength={200}
                defaultValue={product?.name}
                className={inputClass}
              />
            </Field>
            <Field label="Артикул (SKU)">
              <input
                name="sku"
                required
                maxLength={64}
                defaultValue={product?.sku}
                className={inputClass}
              />
            </Field>
            <Field label="Адрес (slug)" hint="Пусто — сгенерируем из названия">
              <input
                name="slug"
                maxLength={100}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Только a-z, 0-9 и дефисы"
                defaultValue={product?.slug}
                placeholder="iphone-16-pro"
                className={inputClass}
              />
            </Field>
            <Field label="Краткое описание" className="sm:col-span-2">
              <input
                name="shortDescription"
                maxLength={300}
                defaultValue={product?.shortDescription ?? ""}
                placeholder="Одна строка для карточки товара"
                className={inputClass}
              />
            </Field>
            <Field label="Описание" className="sm:col-span-2">
              <textarea
                name="description"
                rows={7}
                maxLength={50_000}
                defaultValue={product?.description}
                className={textareaClass}
              />
            </Field>
          </div>
        </Card>

        <ImagesCard images={images} onChange={setImages} />
        <SpecsCard specs={specs} onChange={setSpecs} />
      </div>

      <div className="space-y-6 lg:col-span-4">
        <Card title="Публикация">
          <div className="space-y-4">
            <ToggleRow
              label="На витрине"
              hint="Скрытые товары не видны покупателям"
              checked={isActive}
              onChange={setIsActive}
            />
            <ToggleRow
              label="Хит продаж"
              hint="Показывается на главной"
              checked={isFeatured}
              onChange={setIsFeatured}
            />
          </div>
        </Card>

        <Card title="Цена и склад">
          <div className="space-y-4">
            <Field label="Цена, ₸">
              <input
                name="price"
                type="number"
                required
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={product?.price}
                className={inputClass}
              />
            </Field>
            <Field label="Старая цена, ₸" hint="Для скидки — больше текущей">
              <input
                name="oldPrice"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={product?.oldPrice ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Остаток, шт.">
              <input
                name="stock"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                defaultValue={product?.stock ?? 0}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Каталог">
          <div className="space-y-4">
            <Field label="Категория">
              <select
                name="categoryId"
                required
                defaultValue={product?.category.id ?? ""}
                className={selectClass}
              >
                <option value="" disabled>
                  Выберите категорию
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {indentLabel(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Бренд">
              <select
                name="brandId"
                defaultValue={product?.brand?.id ?? ""}
                className={selectClass}
              >
                <option value="">Без бренда</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Гарантия, мес.">
                <input
                  name="warrantyMonths"
                  type="number"
                  min={0}
                  max={1200}
                  step={1}
                  defaultValue={product?.warrantyMonths ?? ""}
                  className={inputClass}
                />
              </Field>
              <Field label="Вес, г">
                <input
                  name="weightGrams"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={product?.weightGrams ?? ""}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      {/* Панель сохранения всегда под рукой */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-bg/85 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:col-span-12">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Сохранение…" : product ? "Сохранить" : "Создать товар"}
          </Button>
          {result?.saved && (
            <span role="status" className="text-sm text-success">
              Изменения сохранены
            </span>
          )}
          {product && (
            <span className="ml-auto flex gap-2">
              <a
                href={`/product/${product.slug}`}
                target="_blank"
                className="inline-flex h-11 items-center px-3 text-sm font-medium text-muted transition-colors hover:text-fg"
              >
                На сайте ↗
              </a>
              <DeleteButton
                action={deleteProduct.bind(null, product.id, true)}
                confirmText={`Удалить «${product.name}»? Это действие нельзя отменить.`}
              />
            </span>
          )}
        </div>
        {result?.error && (
          <div className="mt-3">
            <FormError message={result.error} />
          </div>
        )}
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Switch checked={checked} label={label} onChange={onChange} />
    </div>
  );
}

function ImagesCard({
  images,
  onChange,
}: {
  images: Image[];
  onChange: (update: (images: Image[]) => Image[]) => void;
}) {
  const { upload, pending, error } = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const move = (index: number, delta: number) =>
    onChange((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  return (
    <Card title="Фото">
      <p className="-mt-3 mb-4 text-sm text-muted">
        Первое фото — главное. JPEG, PNG, WebP или AVIF до 5 МБ.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, i) => (
          <div key={image.key} className="group relative">
            <div className="relative aspect-square overflow-hidden rounded-card bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(image.url)}
                alt={image.alt ?? ""}
                className="h-full w-full object-contain p-3 mix-blend-multiply"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-inverse px-2 py-0.5 text-[0.7rem] font-semibold text-inverse-fg">
                  Главное
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <span className="flex gap-1">
                  <IconButton
                    label="Левее"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronLeftIcon size={16} />
                  </IconButton>
                  <IconButton
                    label="Правее"
                    disabled={i === images.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronRightIcon size={16} />
                  </IconButton>
                </span>
                <IconButton
                  label="Убрать фото"
                  onClick={() =>
                    onChange((list) => list.filter((x) => x.key !== image.key))
                  }
                >
                  <CloseIcon size={16} />
                </IconButton>
              </div>
            </div>
            <input
              value={image.alt ?? ""}
              onChange={(e) => {
                const alt = e.currentTarget.value;
                onChange((list) =>
                  list.map((x) => (x.key === image.key ? { ...x, alt } : x)),
                );
              }}
              maxLength={300}
              placeholder="Подпись"
              aria-label="Подпись к фото"
              className="mt-1.5 h-8 w-full rounded-btn border border-transparent bg-transparent px-2 text-xs outline-none placeholder:text-muted hover:border-border focus:border-accent"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <PlusIcon size={20} />
          {pending ? "Загрузка…" : "Добавить"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          upload(e.currentTarget.files, (url) =>
            onChange((list) => [...list, { key: newKey(), url, alt: null }]),
          );
          e.currentTarget.value = "";
        }}
      />
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Card>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex size-7 items-center justify-center rounded-full bg-bg/90 text-fg shadow-sm transition-colors hover:bg-bg disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SpecsCard({
  specs,
  onChange,
}: {
  specs: Spec[];
  onChange: (update: (specs: Spec[]) => Spec[]) => void;
}) {
  const update = (key: string, field: keyof Spec, value: string) =>
    onChange((list) =>
      list.map((s) => (s.key === key ? { ...s, [field]: value } : s)),
    );

  const cell =
    "h-9 w-full rounded-btn border border-border bg-bg px-2.5 text-base outline-none transition-colors placeholder:text-muted focus:border-accent sm:text-sm";

  return (
    <Card title="Характеристики">
      {specs.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1.3fr_36px] gap-2 text-xs text-muted sm:grid">
            <span>Группа</span>
            <span>Название</span>
            <span>Значение</span>
          </div>
          {specs.map((s) => (
            <div
              key={s.key}
              className="grid grid-cols-[1fr_36px] gap-2 border-b border-border pb-2 last:border-0 sm:grid-cols-[1fr_1fr_1.3fr_36px] sm:border-0 sm:pb-0"
            >
              <input
                value={s.group}
                onChange={(e) => update(s.key, "group", e.currentTarget.value)}
                maxLength={120}
                placeholder="Экран"
                aria-label="Группа"
                className={`${cell} col-start-1 sm:col-start-auto`}
              />
              <input
                value={s.name}
                onChange={(e) => update(s.key, "name", e.currentTarget.value)}
                maxLength={120}
                placeholder="Диагональ"
                aria-label="Название"
                className={`${cell} col-start-1 sm:col-start-auto`}
              />
              <input
                value={s.value}
                onChange={(e) => update(s.key, "value", e.currentTarget.value)}
                maxLength={500}
                placeholder='6,3"'
                aria-label="Значение"
                className={`${cell} col-start-1 sm:col-start-auto`}
              />
              <button
                type="button"
                onClick={() =>
                  onChange((list) => list.filter((x) => x.key !== s.key))
                }
                aria-label="Удалить характеристику"
                className="col-start-2 row-start-1 inline-flex size-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-danger/10 hover:text-danger sm:col-start-auto sm:row-start-auto"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          onChange((list) => [
            ...list,
            {
              key: newKey(),
              name: "",
              value: "",
              // Удобно заполнять группу подряд
              group: list.at(-1)?.group ?? "",
            },
          ])
        }
      >
        <PlusIcon size={16} />
        Добавить характеристику
      </Button>
      <p className="mt-3 text-xs text-muted">
        Строки без названия или значения не сохраняются.
      </p>
    </Card>
  );
}
