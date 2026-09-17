"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { logout } from "@/app/admin/actions";
import type { AdminUser } from "@/lib/admin/types";
import {
  BoxIcon,
  CloseIcon,
  DashboardIcon,
  ExternalIcon,
  FolderIcon,
  LogoutIcon,
  MenuIcon,
  ReceiptIcon,
  SlidesIcon,
  TagIcon,
} from "../icons";
import { ThemeToggle } from "../theme";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Обзор", icon: DashboardIcon },
  { href: "/admin/orders", label: "Заказы", icon: ReceiptIcon },
  { href: "/admin/products", label: "Товары", icon: BoxIcon },
  { href: "/admin/categories", label: "Категории", icon: FolderIcon },
  { href: "/admin/brands", label: "Бренды", icon: TagIcon },
  { href: "/admin/banners", label: "Баннеры", icon: SlidesIcon },
];

function AdminLogo() {
  return (
    <Link href="/admin" className="text-h3 font-bold tracking-tight">
      Nova<span className="text-accent">Link</span>
      <span className="ml-1.5 text-sm font-medium text-muted">admin</span>
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Разделы админки" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 items-center gap-3 rounded-btn px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-surface text-fg"
                : "text-muted hover:bg-surface hover:text-fg"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ user }: { user: AdminUser }) {
  return (
    <div className="border-t border-border pt-4">
      <Link
        href="/"
        target="_blank"
        className="mb-3 flex h-9 items-center gap-3 rounded-btn px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <ExternalIcon size={18} />
        Открыть магазин
      </Link>
      <div className="flex items-center gap-2 px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name || "Администратор"}</p>
          <p className="truncate text-xs text-muted">{user.login}</p>
        </div>
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Выйти"
            title="Выйти"
            className="inline-flex size-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <LogoutIcon size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Десктоп: фиксированная панель слева */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-bg px-3 py-5 lg:flex">
        <div className="mb-8 px-3">
          <AdminLogo />
        </div>
        <div className="flex-1">
          <Nav />
        </div>
        <Footer user={user} />
      </aside>

      {/* Мобильные: верхняя полоса и выезжающая панель */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
        <AdminLogo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-btn transition-colors hover:bg-surface"
        >
          <MenuIcon />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-bg px-3 py-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between pl-3">
              <AdminLogo />
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть меню"
                className="inline-flex size-9 items-center justify-center rounded-btn transition-colors hover:bg-surface"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1">
              <Nav onNavigate={close} />
            </div>
            <Footer user={user} />
          </aside>
        </div>
      )}
    </>
  );
}
