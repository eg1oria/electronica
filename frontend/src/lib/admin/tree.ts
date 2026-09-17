import type { AdminCategory } from "./types";

export type CategoryOption = AdminCategory & { depth: number };

/** Плоский список категорий в порядке дерева — для select и таблицы. */
export function categoryTree(categories: AdminCategory[]): CategoryOption[] {
  const children = new Map<number | null, AdminCategory[]>();
  for (const c of categories) {
    // Родитель мог не попасть в выборку — показываем такие категории в корне.
    const parent =
      c.parentId !== null && categories.some((p) => p.id === c.parentId)
        ? c.parentId
        : null;
    children.set(parent, [...(children.get(parent) ?? []), c]);
  }
  const result: CategoryOption[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const c of children.get(parentId) ?? []) {
      result.push({ ...c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

/** «— — Название» для вложенных категорий в select. */
export const indentLabel = (c: CategoryOption) =>
  `${"— ".repeat(c.depth)}${c.name}`;
