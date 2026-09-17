"use client";

import { Button, ButtonLink, Container } from "@/components/ui";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <h1 className="text-h1 font-semibold">Что-то пошло не так</h1>
      <p className="mt-3 max-w-md text-muted">
        Не удалось загрузить данные. Попробуйте обновить страницу чуть позже.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => retry()}>Повторить</Button>
        <ButtonLink href="/" variant="secondary">
          На главную
        </ButtonLink>
      </div>
    </Container>
  );
}
