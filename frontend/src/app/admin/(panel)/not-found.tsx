import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-20 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-h2 font-semibold">Запись не найдена</h1>
      <p className="mt-2 text-sm text-muted">Возможно, её уже удалили.</p>
      <ButtonLink href="/admin" className="mt-6">
        На главную админки
      </ButtonLink>
    </div>
  );
}
