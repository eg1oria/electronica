import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Корзина" };

export default function CartPage() {
  return (
    <Container className="pt-8">
      <h1 className="text-h1 font-semibold">Корзина</h1>
      <CartView />
    </Container>
  );
}
