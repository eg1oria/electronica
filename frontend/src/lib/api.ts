import "server-only";
import type {
  Banner,
  Brand,
  CategoryDetails,
  CategoryNode,
  Paginated,
  ProductDetails,
  ProductListItem,
  ProductSort,
} from "./types";

/**
 * На сервере можно ходить во внутренний адрес API (например, в Docker).
 * NEXT_PUBLIC_API_URL за nginx бывает относительным («/api») — из серверного
 * fetch такой адрес недоступен, поэтому берём его только если он абсолютный.
 */
export const API_URL = (
  process.env.API_URL?.trim() ||
  publicApiUrl() ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

function publicApiUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  return url && /^https?:\/\//.test(url) ? url : undefined;
}

/** Каталог меняется нечасто — кэшируем ответы на минуту. */
const REVALIDATE_SECONDS = 60;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Сообщение об ошибке от NestJS: message бывает строкой или массивом. */
export async function errorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const message = Array.isArray(body.message)
      ? [...new Set(body.message)].join("; ")
      : body.message;
    if (message) return message;
  } catch {}
  return `Ошибка API (${res.status})`;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

/** null вместо 404 — удобно для notFound(). */
async function requestOrNull<T>(path: string): Promise<T | null> {
  try {
    return await request<T>(path);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export type ProductQuery = {
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.size ? `?${params}` : "";
  return request<Paginated<ProductListItem>>(`/products${qs}`);
}

export function getProduct(slug: string) {
  return requestOrNull<ProductDetails>(
    `/products/${encodeURIComponent(slug)}`,
  );
}

export function getCategories() {
  return request<CategoryNode[]>("/categories");
}

export function getCategory(slug: string) {
  return requestOrNull<CategoryDetails>(
    `/categories/${encodeURIComponent(slug)}`,
  );
}

export function getBrands() {
  return request<Brand[]>("/brands");
}

/** Слайды главной; без них главная покажет запасной вариант. */
export function getBanners() {
  return request<Banner[]>("/banners").catch(() => [] as Banner[]);
}
