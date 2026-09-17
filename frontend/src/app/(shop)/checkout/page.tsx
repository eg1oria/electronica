import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Оформление заказа" };

export default function CheckoutPage() {
  return (
    <Container className="pt-8">
      <h1 className="text-h1 font-semibold">Оформление заказа</h1>
      <CheckoutForm />
    </Container>
  );
}
