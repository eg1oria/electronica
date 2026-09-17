"use client";

import { Button } from "@/components/ui";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
      <h1 className="text-h2 font-semibold">Не удалось загрузить данные</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Проверьте, что API запущено, и попробуйте ещё раз.
      </p>
      <Button onClick={() => retry()} className="mt-6">
        Повторить
      </Button>
    </div>
  );
}
