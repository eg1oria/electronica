import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "nord. — электроника без лишнего",
    template: "%s — nord.",
  },
  description:
    "Смартфоны, ноутбуки, аудио и аксессуары. Официальная гарантия и быстрая доставка.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme выставляет ThemeScript до гидрации
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
