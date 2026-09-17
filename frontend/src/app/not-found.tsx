import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-h1 font-semibold">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-muted">
        Возможно, товар сняли с продажи или ссылка устарела.
      </p>
      <ButtonLink href="/catalog" className="mt-8">
        Перейти в каталог
      </ButtonLink>
    </Container>
  );
}
