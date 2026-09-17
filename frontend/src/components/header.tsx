import Form from "next/form";
import Link from "next/link";
import { getCategories } from "@/lib/api";
import type { CategoryNode } from "@/lib/types";
import { HeaderCartLink, HeaderFavoritesLink } from "./cart-buttons";
import { SearchIcon } from "./icons";
import { ThemeToggle } from "./theme";
import { Container } from "./ui";

export function Logo() {
  return (
    <Link href="/" className="text-h3 font-bold tracking-tight">
      Nova<span className="text-accent">Link</span>
    </Link>
  );
}

function SearchForm({ className = "" }: { className?: string }) {
  return (
    <Form action="/catalog" role="search" className={`relative ${className}`}>
      <SearchIcon
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        name="search"
        placeholder="Поиск по каталогу"
        aria-label="Поиск по каталогу"
        maxLength={200}
        className="h-9 w-full rounded-btn bg-surface pr-3 pl-9 text-base text-fg outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40 sm:text-sm"
      />
    </Form>
  );
}

async function loadCategories(): Promise<CategoryNode[]> {
  // Шапка не должна ронять страницу, если API недоступно.
  return getCategories().catch(() => []);
}

export async function Header() {
  const categories = await loadCategories();

  const nav = categories.map((c) => (
    <Link
      key={c.id}
      href={`/catalog?category=${c.slug}`}
      className="shrink-0 text-sm font-medium text-fg/80 transition-colors hover:text-fg"
    >
      {c.name}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-xl">
      <Container>
        <div className="flex h-14 items-center gap-6 sm:h-16">
          <Logo />
          <nav aria-label="Категории" className="hidden items-center gap-6 lg:flex">
            {nav}
          </nav>
          <SearchForm className="ml-auto hidden w-full max-w-72 md:block" />
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <ThemeToggle />
            <HeaderFavoritesLink />
            <span className="ml-1.5">
              <HeaderCartLink />
            </span>
          </div>
        </div>
        <div className="pb-3 md:hidden">
          <SearchForm />
        </div>
        {nav.length > 0 && (
          <nav
            aria-label="Категории"
            className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 lg:hidden"
          >
            {nav}
          </nav>
        )}
      </Container>
    </header>
  );
}
