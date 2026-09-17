import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

/** Шапка и подвал магазина (админка живёт без них). */
export function ShopShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
