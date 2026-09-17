"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { API_URL, ApiError } from "@/lib/api";
import { TOKEN_COOKIE, TOKEN_MAX_AGE } from "@/lib/admin/constants";
import { adminFetch, requireUser } from "@/lib/admin/session";
import type { ActionState, AdminUser, Role } from "@/lib/admin/types";

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

/* Вход и выход */

export async function login(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: text(data, "email"),
      password: String(data.get("password") ?? ""),
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!res) return { error: "API недоступно. Попробуйте позже." };
  if (res.status === 429) {
    return { error: "Слишком много попыток. Подождите минуту." };
  }
  if (!res.ok) return { error: "Неверный email или пароль" };

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

export async function deleteProduct(id: number) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/products/${id}`, { method: "DELETE" }),
  );
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

export async function deleteCategory(id: number) {
  await requireUser();
  return mutate(() =>
    adminFetch(`/admin/categories/${id}`, { method: "DELETE" }),
  );
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

export async function deleteBrand(id: number) {
  await requireUser();
  return mutate(() => adminFetch(`/admin/brands/${id}`, { method: "DELETE" }));
}

/* Сотрудники (только ADMIN) */

export async function saveUser(
  id: number | null,
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireUser("ADMIN");
  const password = String(data.get("password") ?? "");
  const result = await mutate(() =>
    adminFetch(id ? `/admin/users/${id}` : "/admin/users", {
      method: id ? "PATCH" : "POST",
      json: {
        email: text(data, "email"),
        name: text(data, "name") || undefined,
        role: text(data, "role") as Role,
        // При редактировании пустой пароль — «не менять».
        ...(password && { password }),
      },
    }),
  );
  if (result?.error) return result;
  redirect("/admin/users");
}

export async function deleteUser(id: number) {
  await requireUser("ADMIN");
  return mutate(() => adminFetch(`/admin/users/${id}`, { method: "DELETE" }));
}
