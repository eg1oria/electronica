import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { buttonClass } from "../ui";

export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeftIcon size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2 font-semibold sm:text-h1">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-card border border-border bg-bg p-5 sm:p-6 ${className}`}
    >
      {title && <h2 className="mb-5 text-h3 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/** Таблица в карточке с горизонтальной прокруткой на узких экранах. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-3 [&_th]:bg-surface [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted">
        {children}
      </table>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card bg-surface px-6 py-16 text-center">
      <h2 className="text-h3 font-semibold">{title}</h2>
      {text && <p className="mt-2 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatusDot({
  on,
  labels,
}: {
  on: boolean;
  labels: [string, string];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${on ? "text-success" : "text-muted"}`}
    >
      <span
        className={`size-1.5 rounded-full ${on ? "bg-success" : "bg-muted"}`}
      />
      {on ? labels[0] : labels[1]}
    </span>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-btn bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
    >
      {message}
    </p>
  );
}

export const textareaClass =
  "w-full rounded-btn border border-border bg-bg px-3.5 py-2.5 text-base text-fg placeholder:text-muted transition-colors outline-none focus:border-accent sm:text-sm";

export const selectClass =
  "h-11 w-full appearance-none rounded-btn border border-border bg-bg bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236e6e73' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[position:right_12px_center] bg-no-repeat pr-9 pl-3.5 text-base text-fg outline-none transition-colors focus:border-accent sm:text-sm";

/** «Страница N из M» и стрелки; href строит ссылку на страницу. */
export function Pager({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Страницы"
      className="mt-6 flex items-center justify-between gap-4 text-sm"
    >
      <span className="text-muted">
        Страница {page} из {pages}
      </span>
      <div className="flex gap-2">
        <PageLink href={href(page - 1)} disabled={page <= 1} label="Назад">
          <ChevronLeftIcon size={18} />
        </PageLink>
        <PageLink href={href(page + 1)} disabled={page >= pages} label="Вперёд">
          <ChevronRightIcon size={18} />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  const className = `${buttonClass("secondary", "sm")} !px-2.5`;
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
