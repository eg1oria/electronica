import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { API_URL, ApiError } from "../api";
import { TOKEN_COOKIE } from "./constants";
import type { AdminUser, Role } from "./types";

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

/** Сообщение об ошибке от NestJS: message бывает строкой или массивом. */
async function errorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? body.message.join("; ")
      : body.message;
    if (message) return message;
  } catch {}
  return `Ошибка API (${res.status})`;
}

/** Запрос к админскому API с токеном текущей сессии, без кэша. */
export async function adminFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = await getToken();
  const { json, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Текущий сотрудник или null, если сессии нет или она истекла. */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  if (!(await getToken())) return null;
  try {
    return await adminFetch<AdminUser>("/auth/me");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return null;
    }
    throw e;
  }
});

/** Для страниц и Server Actions: без сессии — на страницу входа. */
export async function requireUser(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (roles.length && !roles.includes(user.role)) redirect("/admin");
  return user;
}

/** Админские GET-запросы: сессия истекла — на вход, 404 — null. */
export async function adminGet<T>(path: string): Promise<T> {
  try {
    return await adminFetch<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/admin/login");
    throw e;
  }
}

export async function adminGetOrNull<T>(path: string): Promise<T | null> {
  try {
    return await adminGet<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
