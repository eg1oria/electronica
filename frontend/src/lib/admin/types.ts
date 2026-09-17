import type {
  Category,
  Paginated,
  ProductDetails,
  ProductListItem,
} from "../types";

export type Role = "ADMIN" | "MANAGER";

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: Role;
};

export type StaffUser = AdminUser & { createdAt: string; updatedAt: string };

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

/** Результат Server Action для useActionState. */
export type ActionState = { error?: string; ok?: boolean } | undefined;
