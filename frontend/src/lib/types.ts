/** Типы ответов API (см. backend/README.md). */

export type Ref = { id: number; name: string; slug: string };

export type ProductImage = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductSpec = {
  id: number;
  name: string;
  value: string;
  group: string | null;
  position: number;
};

type ProductBase = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isFeatured: boolean;
  warrantyMonths: number | null;
  weightGrams: number | null;
  createdAt: string;
};

/** В списке приходит только главное фото. */
export type ProductListItem = ProductBase & {
  images: ProductImage[];
  category: Ref;
  brand: Ref | null;
};

export type ProductDetails = ProductBase & {
  images: ProductImage[];
  specs: ProductSpec[];
  category: Ref & { parentId: number | null };
  brand: (Ref & { logo: string | null }) | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name";

export type Category = Ref & {
  description: string | null;
  image: string | null;
  parentId: number | null;
};

export type CategoryNode = Category & {
  productsCount: number;
  children: CategoryNode[];
};

export type CategoryDetails = Category & {
  parent: Category | null;
  children: Category[];
};

export type Brand = Ref & {
  logo: string | null;
  _count: { products: number };
};

/** Слайд промо-блока на главной. Пустые поля берутся из товара. */
export type Banner = {
  id: number;
  productId: number;
  badge: string | null;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  position: number;
  isActive: boolean;
  product: {
    id: number;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string;
    price: number;
    oldPrice: number | null;
    isActive: boolean;
    images: ProductImage[];
    category: Ref;
  };
};

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";
export type DeliveryMethod = "COURIER" | "PICKUP";
export type PaymentMethod = "ON_DELIVERY" | "INSTALLMENT";

/** Позиция заказа — снимок товара на момент оформления. */
export type OrderItem = {
  id: number;
  productId: number | null;
  name: string;
  sku: string;
  price: number;
  qty: number;
  /** null, если товар удалён из каталога */
  product: {
    slug: string;
    images: ProductImage[];
    category: { slug: string };
  } | null;
};

export type Order = {
  id: number;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string | null;
  delivery: DeliveryMethod;
  city: string | null;
  address: string | null;
  apartment: string | null;
  payment: PaymentMethod;
  comment: string | null;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};
