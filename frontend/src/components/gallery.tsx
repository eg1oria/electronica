"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/types";
import { ProductMedia } from "./product-media";

export function Gallery({
  images,
  name,
  categorySlug,
}: {
  images: ProductImage[];
  name: string;
  categorySlug: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <ProductMedia
        src={current?.url ?? null}
        alt={current?.alt ?? name}
        categorySlug={categorySlug}
        priority
        className="flex-1"
      />
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Фото товара"
          className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Фото ${i + 1}`}
              onClick={() => setActive(i)}
              className={`w-20 shrink-0 rounded-card ring-2 transition-shadow ${
                i === active ? "ring-accent" : "ring-transparent hover:ring-border"
              }`}
            >
              <ProductMedia
                src={img.url}
                alt=""
                categorySlug={categorySlug}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
