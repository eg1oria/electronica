import { statusInfo } from "@/lib/admin/orders";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, tone } = statusInfo(status);
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${tone}`}
    >
      {label}
    </span>
  );
}
