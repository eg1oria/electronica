const priceFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

/** 529990 → «529 990 ₸» */
export function formatPrice(value: number) {
  return `${priceFormatter.format(value)} ₸`;
}

/** Скидка в процентах, если есть старая цена. */
export function discountPercent(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

/** «1 товар», «2 товара», «5 товаров» */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const ASSET_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
).origin;

/** Фото из API приходят как /uploads/... — они раздаются с корня сервера API. */
export function assetUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `${ASSET_ORIGIN}${url}`;
}

/** Текущее время для серверных компонентов (бейдж «Новинка»). */
export const serverNow = () => Date.now();
