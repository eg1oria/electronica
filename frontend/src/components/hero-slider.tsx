"use client";

import { useEffect, useRef, useState } from "react";
import { discountPercent, formatPrice } from "@/lib/format";
import { ProductMedia } from "./product-media";
import { Badge, ButtonLink } from "./ui";

export type HeroSlide = {
  key: string | number;
  badge: string;
  title: string;
  subtitle: string;
  image: string | null;
  imageAlt: string;
  categorySlug: string;
  href: string;
  price: number;
  oldPrice: number | null;
};

const INTERVAL_MS = 3000;
/** Сколько пикселей нужно протащить, чтобы перелистнуть. */
const SWIPE_THRESHOLD = 50;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  // Анимация появления — только при смене слайда, не при загрузке страницы.
  const [changed, setChanged] = useState(false);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const count = slides.length;

  const go = (next: number) => {
    setChanged(true);
    setIndex((next + count) % count);
  };

  // Автопрокрутка; ручное перелистывание перезапускает таймер.
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setTimeout(() => {
      setChanged(true);
      setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  if (count === 0) return null;

  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    if (dragX <= -SWIPE_THRESHOLD) go(index + 1);
    else if (dragX >= SWIPE_THRESHOLD) go(index - 1);
    setDragX(0);
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Предложения"
      className="relative overflow-hidden rounded-card bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div
        className={`flex touch-pan-y select-none ${
          dragX ? "" : "transition-transform duration-500 ease-out motion-reduce:transition-none"
        }`}
        style={{ transform: `translateX(calc(${-index * 100}% + ${dragX}px))` }}
        onPointerDown={(e) => {
          if (count < 2 || e.button !== 0) return;
          drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          const start = drag.current;
          if (!start || start.id !== e.pointerId) return;
          const dx = e.clientX - start.x;
          // Вертикальный жест — это прокрутка страницы, не свайп.
          if (!dragX && Math.abs(e.clientY - start.y) > Math.abs(dx)) {
            drag.current = null;
            return;
          }
          if (Math.abs(dx) > 5 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          setDragX(dx);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // После свайпа не переходим по ссылке под пальцем
        onClickCapture={(e) => {
          if (Math.abs(dragX) > 5) e.preventDefault();
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} из ${count}`}
            aria-hidden={i !== index}
            inert={i !== index}
            className="w-full shrink-0"
          >
            <Slide
              // Новый key перезапускает анимацию появления
              key={changed && i === index ? `on-${index}` : "off"}
              slide={slide}
              priority={i === 0}
              animate={changed && i === index}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:bottom-6">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1}`}
              aria-current={i === index}
              className="flex h-6 items-center px-0.5"
            >
              <span
                className={`block h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-fg/25" : "w-1.5 bg-fg/25 hover:bg-fg/45"
                }`}
              >
                {i === index && (
                  // Заполняется до следующей смены; на паузе — целиком
                  <span
                    key={`${index}-${paused}`}
                    className={`block h-full w-full origin-left rounded-full bg-fg ${
                      paused ? "" : "motion-safe:animate-fill"
                    }`}
                    style={{ animationDuration: `${INTERVAL_MS}ms` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({
  slide,
  priority,
  animate,
}: {
  slide: HeroSlide;
  priority: boolean;
  animate: boolean;
}) {
  const discount = discountPercent(slide.price, slide.oldPrice);
  // Элементы текста всплывают по очереди
  const rise = (delay: number) =>
    animate
      ? { className: "motion-safe:animate-rise", style: { animationDelay: `${delay}ms` } }
      : { className: "", style: undefined };

  return (
    <div className="grid h-full grid-cols-1 items-center gap-8 p-6 pb-14 sm:p-10 sm:pb-16 md:grid-cols-12 lg:p-14 lg:pb-16">
      <div className="md:col-span-6">
        <div className={`flex flex-wrap gap-2 ${rise(0).className}`}>
          <Badge tone="neutral">{slide.badge}</Badge>
          {discount > 0 && <Badge tone="danger">−{discount}%</Badge>}
        </div>
        <h2
          className={`mt-5 text-h1 font-semibold text-balance sm:text-display ${rise(60).className}`}
          style={rise(60).style}
        >
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p
            className={`mt-4 line-clamp-3 max-w-md text-base text-muted ${rise(120).className}`}
            style={rise(120).style}
          >
            {slide.subtitle}
          </p>
        )}
        <div
          className={`mt-8 flex flex-wrap gap-3 ${rise(180).className}`}
          style={rise(180).style}
        >
          <ButtonLink href={slide.href} variant="accent" size="lg" draggable={false}>
            Купить за {formatPrice(slide.price)}
          </ButtonLink>
          <ButtonLink
            href={`${slide.href}#specs`}
            variant="secondary"
            size="lg"
            draggable={false}
          >
            Подробнее
          </ButtonLink>
        </div>
      </div>
      <div className="pointer-events-none relative md:col-span-6">
        {/* Мягкое свечение за товаром */}
        <div
          aria-hidden
          className="absolute inset-[18%] rounded-full bg-accent/[0.06] blur-3xl"
        />
        <div className={animate ? "motion-safe:animate-pop" : undefined}>
          <div className="motion-safe:animate-float">
            <ProductMedia
              src={slide.image}
              alt={slide.imageAlt}
              categorySlug={slide.categorySlug}
              priority={priority}
              frame="aspect-[4/3]"
              inset="p-[4%]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
