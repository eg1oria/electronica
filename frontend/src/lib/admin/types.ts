import type {
  Category,
  Paginated,
  ProductDetails,
  ProductListItem,
} from "../types";

export type AdminUser = {
  id: number;
  login: string;
  name: string | null;
  role: "ADMIN" | "MANAGER";
};

export type AdminProductListItem = ProductListItem & { isActive: boolean };
export type AdminProductList = Paginated<AdminProductListItem>;
export type AdminProduct = ProductDetails & { isActive: boolean };

export type AdminCategory = Category & {
  _count: { products: number; children: number };
};

export type AdminBrand = {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  _count?: { products: number };
};

export type { Banner as AdminBanner } from "../types";
export const MAX_BANNERS = 5;

/** Результат Server Action для useActionState. */
export type ActionState = { error?: string; ok?: boolean } | undefined;
