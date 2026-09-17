"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { FormError } from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/admin/orders";
import type { OrderStatus } from "@/lib/types";

/** Смена статуса заказа. Отмена необратима и возвращает товары на склад. */
export function StatusControl({
  id,
  status,
}: {
  id: number;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  if (status === "CANCELLED") {
    return (
      <p className="text-sm text-muted">
        Заказ отменён, товары возвращены на склад. Изменить статус нельзя.
      </p>
    );
  }

  function change(next: OrderStatus) {
    if (next === status) return;
    if (
      next === "CANCELLED" &&
      !confirm("Отменить заказ? Товары вернутся на склад, вернуть заказ в работу будет нельзя.")
    ) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await updateOrderStatus(id, next);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5" role="radiogroup" aria-label="Статус заказа">
        {ORDER_STATUSES.map((s) => {
          const active = s.value === status;
          return (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => change(s.value)}
              className={`flex h-10 items-center gap-3 rounded-btn border px-3 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
                active
                  ? "border-accent bg-accent/5"
                  : s.value === "CANCELLED"
                    ? "border-border text-danger hover:bg-danger/5"
                    : "border-border hover:bg-surface"
              }`}
            >
              <span
                className={`size-3.5 shrink-0 rounded-full border ${
                  active ? "border-4 border-accent" : "border-border"
                }`}
              />
              {s.value === "CANCELLED" ? "Отменить заказ" : s.label}
            </button>
          );
        })}
      </div>
      <FormError message={error} />
    </div>
  );
}
