import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Админка", template: "%s — NovaLink admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
