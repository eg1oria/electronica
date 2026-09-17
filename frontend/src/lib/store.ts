"use client";

import { useSyncExternalStore } from "react";

/**
 * Корзина и избранное в localStorage. Храним снимок товара, чтобы
 * отрисовывать корзину без запросов к API.
 */
export type StoredProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string | null;
  categorySlug: string;
  stock: number;
};

export type CartItem = StoredProduct & { qty: number };

type State = { cart: CartItem[]; favorites: StoredProduct[] };

const KEY = "nord:store:v1";
const EMPTY: State = { cart: [], favorites: [] };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    // Повреждённые данные или недоступное хранилище — начинаем с пустого.
  }
}

function setState(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Приватный режим — корзина живёт до перезагрузки.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Синхронизация между вкладками
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

const getServerSnapshot = () => EMPTY;

export function useStore<T>(selector: (s: State) => T): T {
  return selector(
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),
  );
}

const clampQty = (qty: number, stock: number) =>
  Math.max(1, Math.min(qty, Math.max(stock, 1), 99));

export const cart = {
  add(product: StoredProduct, qty = 1) {
    load();
    const existing = state.cart.find((i) => i.id === product.id);
    const items = existing
      ? state.cart.map((i) =>
          i.id === product.id
            ? { ...i, ...product, qty: clampQty(i.qty + qty, product.stock) }
            : i,
        )
      : [...state.cart, { ...product, qty: clampQty(qty, product.stock) }];
    setState({ ...state, cart: items });
  },
  setQty(id: number, qty: number) {
    setState({
      ...state,
      cart: state.cart.map((i) =>
        i.id === id ? { ...i, qty: clampQty(qty, i.stock) } : i,
      ),
    });
  },
  remove(id: number) {
    setState({ ...state, cart: state.cart.filter((i) => i.id !== id) });
  },
  clear() {
    setState({ ...state, cart: [] });
  },
};

export const favorites = {
  toggle(product: StoredProduct) {
    load();
    const has = state.favorites.some((f) => f.id === product.id);
    setState({
      ...state,
      favorites: has
        ? state.favorites.filter((f) => f.id !== product.id)
        : [...state.favorites, product],
    });
  },
};

export const cartCount = (s: State) =>
  s.cart.reduce((sum, i) => sum + i.qty, 0);

export const cartTotal = (s: State) =>
  s.cart.reduce((sum, i) => sum + i.price * i.qty, 0);

const noopSubscribe = () => () => {};

/** false на сервере и при гидрации — чтобы не мигала «пустая корзина». */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
