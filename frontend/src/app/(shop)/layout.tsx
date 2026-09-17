import { ShopShell } from "@/components/shop-shell";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return <ShopShell>{children}</ShopShell>;
}
