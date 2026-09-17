"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { uploadImage } from "@/app/admin/actions";
import type { ActionState } from "@/lib/admin/types";
import { assetUrl } from "@/lib/format";
import { CloseIcon, ImageIcon, TrashIcon } from "../icons";
import { Button, inputClass } from "../ui";

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение…" : children}
    </Button>
  );
}

/** Удаление с подтверждением; ошибку API показываем тут же. */
export function DeleteButton({
  action,
  confirmText,
  label = "Удалить",
  iconOnly,
}: {
  action: () => Promise<ActionState>;
  confirmText: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action();
      if (result?.error) alert(result.error);
    });
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={label}
        title={label}
        className="inline-flex size-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
      >
        <TrashIcon size={16} />
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      disabled={pending}
      className="text-danger"
    >
      {pending ? "Удаление…" : label}
    </Button>
  );
}

/** Переключатель, который сразу сохраняет значение. */
export function Switch({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function ServerSwitch({
  checked,
  label,
  action,
}: {
  checked: boolean;
  label: string;
  action: (value: boolean) => Promise<ActionState>;
}) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const value = pending && optimistic !== null ? optimistic : checked;

  return (
    <Switch
      checked={value}
      label={label}
      disabled={pending}
      onChange={(next) => {
        setOptimistic(next);
        startTransition(async () => {
          const result = await action(next);
          if (result?.error) alert(result.error);
        });
      }}
    />
  );
}

/** Остаток на складе: правка прямо в таблице, сохранение по Enter или blur. */
export function StockInput({
  value,
  action,
}: {
  value: number;
  action: (stock: number) => Promise<ActionState>;
}) {
  const [pending, startTransition] = useTransition();

  function save(input: HTMLInputElement) {
    const stock = Number(input.value);
    if (!Number.isInteger(stock) || stock < 0) {
      input.value = String(value);
      return;
    }
    if (stock === value) return;
    startTransition(async () => {
      const result = await action(stock);
      if (result?.error) {
        alert(result.error);
        input.value = String(value);
      }
    });
  }

  return (
    <input
      // Новое значение с сервера — пересоздаём поле
      key={value}
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      defaultValue={value}
      disabled={pending}
      aria-label="Остаток"
      onBlur={(e) => save(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-8 w-20 rounded-btn border border-transparent bg-transparent px-2 text-sm tabular-nums outline-none transition-colors hover:border-border focus:border-accent disabled:opacity-50"
    />
  );
}

/** Загружает файл в API и возвращает URL. */
export function useUpload() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function upload(files: FileList | null, onDone: (url: string) => void) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setError(undefined);
    startTransition(async () => {
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`«${file.name}» больше 5 МБ`);
          continue;
        }
        const data = new FormData();
        data.set("file", file);
        const result = await uploadImage(data);
        if ("error" in result) setError(result.error);
        else onDone(result.url);
      }
    });
  }

  return { upload, pending, error };
}

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Одно изображение (логотип бренда, фото категории) → скрытое поле формы. */
export function ImageField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const { upload, pending, error } = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-card bg-surface text-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl(url)}
              alt=""
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <ImageIcon size={24} />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            {pending ? "Загрузка…" : url ? "Заменить" : "Загрузить"}
          </Button>
          {url && (
            <Button variant="ghost" size="sm" onClick={() => setUrl("")}>
              <CloseIcon size={16} />
              Убрать
            </Button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(e) => {
          upload(e.currentTarget.files, setUrl);
          e.currentTarget.value = "";
        }}
      />
      <input
        type="url"
        value={url.startsWith("/uploads/") ? "" : url}
        onChange={(e) => setUrl(e.currentTarget.value.trim())}
        placeholder="или ссылка https://…"
        className={`${inputClass} mt-3`}
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
