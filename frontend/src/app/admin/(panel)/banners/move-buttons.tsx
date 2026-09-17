"use client";

import { useTransition } from "react";
import { reorderBanners } from "@/app/admin/actions";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";

/** Сдвигает слайд вверх/вниз и сохраняет новый порядок. */
export function MoveButtons({ ids, index }: { ids: number[]; index: number }) {
  const [pending, startTransition] = useTransition();

  function move(delta: number) {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    startTransition(async () => {
      const result = await reorderBanners(next);
      if (result?.error) alert(result.error);
    });
  }

  const button =
    "inline-flex size-7 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-fg disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        onClick={() => move(-1)}
        disabled={pending || index === 0}
        aria-label="Выше"
        className={button}
      >
        <ArrowUpIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        disabled={pending || index === ids.length - 1}
        aria-label="Ниже"
        className={button}
      >
        <ArrowDownIcon size={16} />
      </button>
    </div>
  );
}
