"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { API_URL, ApiError } from "@/lib/api";
import { TOKEN_COOKIE, TOKEN_MAX_AGE } from "@/lib/admin/constants";
import { adminFetch, requireUser } from "@/lib/admin/session";
import type { ActionState, AdminUser } from "@/lib/admin/types";
import type { OrderStatus } from "@/lib/types";

/* Вспомогательное */

const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();

/** Пустое поле → null (чтобы можно было очистить значение). */
const optional = (data: FormData, key: string) => text(data, key) || null;

/** Пустой slug не отправляем — API сгенерирует его из названия. */
const slug = (data: FormData) => text(data, "slug") || undefined;

const optionalId = (data: FormData, key: string) => {
  const value = text(data, key);
  return value ? Number(value) : null;
};

/**
 * Выполняет мутацию и превращает ошибку API в сообщение для формы.
 * Истёкшая сессия — на страницу входа.
 */
async function mutate(run: () => Promise<unknown>): Promise<ActionState> {
  let expired = false;
  try {
    await run();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.status !== 401) return { error: e.message };
    expired = true;
  }
  if (expired) redirect("/admin/login");
  // Меняется и витрина магазина, и списки в админке.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Удаление; со страницы редактирования — сразу обратно к списку. */
async function remove(path: string, listPath: string, toList: boolean) {
  await requireUser();
  const result = await mutate(() => adminFetch(path, { method: "DELETE" }));
  if (result?.error || !toList) return result;
  redirect(listPath);
}

const bool = (data: FormData, key: string) => data.get(key) === "on";

/* Вход и выход */

export async function login(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: text(data, "login"),
      password: String(data.get("password") ?? ""),
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!res) return { error: "API недоступно. Попробуйте позже." };
  if (res.status === 429) {
    return { error: "Слишком много попыток. Подождите минуту." };
  }
  if (!res.ok) return { error: "Неверный логин или пароль" };

  const { accessToken } = (await res.json()) as {
    accessToken: string;
    user: AdminUser;
  };
  (await cookies()).set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/admin/login");
}

/* Фото */

export async function uploadImage(
  data: FormData,
): Promise<{ url: string } | { error: string }> {
  await requireUser();
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  const body = new FormData();
  body.set("file", file);
  let url = "";
  const result = await mutate(async () => {
    ({ url } = await adminFetch<{ url: string }>("/admin/uploads", {
      method: "POST",
      body,
    }));
  });
  return result?.error ? { error: result.error } : { url };
}

/* Товары */

export type ProductInput = {
  name: string;
  slug?: string;
  sku: string;
  shortDescription: string | null;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  warrantyMonths: number | null;
  weightGrams: number | null;
  categoryId: number;
  brandId: number | null;
  images: { url: string; alt: string | null }[];
  specs: { name: string; value: string; group: string | null }[];
};

export async function saveProduct(
  id: number | null,
  input: ProductInput,
): Promise<ActionState> {
  await requireUser();
  const result = await mutate(() =>
    adminFetch(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PATCH" : "POST",
      json: input,
    }),
  );
  if (result?.error || id) return result;
  redirect("/admin/products");
}

export async function deleteProduct(id: number, toList = false) {
  return remove(`/admin/products/${id}`, "/admin/products", toList);
}

export async function toggleProduct(
  id: number,
  field: "isActive" | "isFeatured",
  value: boolean,
) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/products/${id}`, {
      method: "PATCH",
      json: { [field]: value },
    }),
  );
}

export async function updateStock(id: number, stock: number) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/products/${id}/stock`, {
      method: "PATCH",
      json: { stock },
    }),
  );
}

/* Категории */

export async function saveCategory(
  id: number | null,
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireUser();
  const result = await mutate(() =>
    adminFetch(id ? `/admin/categories/${id}` : "/admin/categories", {
      method: id ? "PATCH" : "POST",
      json: {
        name: text(data, "name"),
        slug: slug(data),
        description: optional(data, "description"),
        image: optional(data, "image"),
        parentId: optionalId(data, "parentId"),
      },
    }),
  );
  if (result?.error) return result;
  redirect("/admin/categories");
}

export async function deleteCategory(id: number, toList = false) {
  return remove(`/admin/categories/${id}`, "/admin/categories", toList);
}

/* Бренды */

export async function saveBrand(
  id: number | null,
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireUser();
  const result = await mutate(() =>
    adminFetch(id ? `/admin/brands/${id}` : "/admin/brands", {
      method: id ? "PATCH" : "POST",
      json: {
        name: text(data, "name"),
        slug: slug(data),
        logo: optional(data, "logo"),
        description: optional(data, "description"),
      },
    }),
  );
  if (result?.error) return result;
  redirect("/admin/brands");
}

export async function deleteBrand(id: number, toList = false) {
  return remove(`/admin/brands/${id}`, "/admin/brands", toList);
}

/* Баннеры на главной */

export async function saveBanner(
  id: number | null,
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireUser();
  const result = await mutate(() =>
    adminFetch(id ? `/admin/banners/${id}` : "/admin/banners", {
      method: id ? "PATCH" : "POST",
      json: {
        productId: Number(text(data, "productId")),
        badge: optional(data, "badge"),
        title: optional(data, "title"),
        subtitle: optional(data, "subtitle"),
        image: optional(data, "image"),
        isActive: bool(data, "isActive"),
      },
    }),
  );
  if (result?.error) return result;
  redirect("/admin/banners");
}

export async function toggleBanner(id: number, isActive: boolean) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/banners/${id}`, {
      method: "PATCH",
      json: { isActive },
    }),
  );
}

/** Порядок слайдов: все id в новом порядке. */
export async function reorderBanners(ids: number[]) {
  await requireUser();
  return mutate(() =>
    adminFetch("/admin/banners/order", { method: "PUT", json: { ids } }),
  );
}

export async function deleteBanner(id: number, toList = false) {
  return remove(`/admin/banners/${id}`, "/admin/banners", toList);
}

/* Заказы */

/** Отмена возвращает товары на склад — это делает API. */
export async function updateOrderStatus(id: number, status: OrderStatus) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/orders/${id}`, { method: "PATCH", json: { status } }),
  );
}
