import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { FavoritesView } from "./favorites-view";

export const metadata: Metadata = { title: "Избранное" };

export default function FavoritesPage() {
  return (
    <Container className="pt-8">
      <h1 className="text-h1 font-semibold">Избранное</h1>
      <FavoritesView />
    </Container>
  );
}
