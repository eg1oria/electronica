import Link from "next/link";
import { getCategories } from "@/lib/api";
import { Logo } from "./header";
import { Container } from "./ui";

export async function Footer() {
  const categories = await getCategories().catch(() => []);

  const columns = [
    {
      title: "Каталог",
      links: categories.slice(0, 5).map((c) => ({
        href: `/catalog?category=${c.slug}`,
        label: c.name,
      })),
    },
    {
      title: "Покупателям",
      links: [
        { href: "/help#delivery", label: "Доставка и оплата" },
        { href: "/help#warranty", label: "Гарантия и возврат" },
        { href: "/help#trade-in", label: "Трейд-ин" },
      ],
    },
    {
      title: "Компания",
      links: [
        { href: "/help#about", label: "О нас" },
        { href: "/help#contacts", label: "Контакты" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border">
      <Container className="grid grid-cols-1 gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Электроника без лишнего.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-fg"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
      <Container className="border-t border-border py-6 text-sm text-muted">
        © {new Date().getFullYear()} NovaLink
      </Container>
    </footer>
  );
}
