import "server-only";
import type {
  Brand,
  CategoryDetails,
  CategoryNode,
  Paginated,
  ProductDetails,
  ProductListItem,
  ProductSort,
} from "./types";

/** На сервере можно ходить во внутренний адрес API (например, в Docker). */
export const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api"
).replace(/\/$/, "");

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
