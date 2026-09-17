import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Покупателям" };

// Тексты-заготовки: заменить реальными условиями магазина.
const SECTIONS = [
  {
    id: "delivery",
    title: "Доставка и оплата",
    text: "Доставляем курьером по городу или отдаём заказ в магазине. Оплатить можно картой или наличными при получении, а также оформить рассрочку — менеджер расскажет об условиях при подтверждении заказа.",
  },
  {
    id: "warranty",
    title: "Гарантия и возврат",
    text: "На всю технику действует официальная гарантия производителя. Если товар не подошёл, его можно вернуть в сохранённой упаковке в течение срока, установленного законом.",
  },
  {
    id: "trade-in",
    title: "Трейд-ин",
    text: "Принесите старое устройство в магазин — мы оценим его и учтём стоимость в покупке нового.",
  },
  {
    id: "about",
    title: "О нас",
    text: "nord. — магазин электроники без лишнего: только проверенные устройства, понятные цены и честные характеристики.",
  },
  {
    id: "contacts",
    title: "Контакты",
    text: "Адрес магазина, телефон и часы работы появятся здесь.",
  },
];

export default function HelpPage() {
  return (
    <Container className="pt-8">
      <h1 className="text-h1 font-semibold">Покупателям</h1>
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <nav aria-label="Разделы" className="lg:col-span-3">
          <ul className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-btn px-3 py-2 text-sm font-medium hover:bg-surface"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-12 lg:col-span-7">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-h2 font-semibold">{s.title}</h2>
              <p className="mt-3 leading-relaxed text-fg/85">{s.text}</p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
