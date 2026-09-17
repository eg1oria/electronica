import type { ReactNode } from "react";
import { assetUrl } from "@/lib/format";
import { deviceKind, type DeviceKind } from "./icons";

type Props = {
  src: string | null;
  alt: string;
  categorySlug: string;
  /** Для главного фото на первом экране */
  priority?: boolean;
  /** Пропорции и фон рамки */
  frame?: string;
  /** Отступ фото от краёв рамки */
  inset?: string;
  className?: string;
};

/**
 * Фото товара на светло-сером фоне. Пока фото не загружено —
 * нейтральный силуэт устройства по категории.
 */
export function ProductMedia({
  src,
  alt,
  categorySlug,
  priority,
  frame = "aspect-square bg-surface",
  inset = "p-[12%]",
  className = "",
}: Props) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-card ${frame} ${className}`}
    >
      {src ? (
        // Фото приходят с сервера API — отдаём как есть, без оптимизатора Next.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(src)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className={`h-full w-full object-contain ${inset} mix-blend-multiply dark:mix-blend-normal`}
        />
      ) : (
        <DeviceSilhouette kind={deviceKind(categorySlug)} />
      )}
    </div>
  );
}

const silhouettes: Record<DeviceKind, ReactNode> = {
  phone: (
    <svg viewBox="0 0 120 200" className="h-[62%]">
      <rect x="4" y="4" width="112" height="192" rx="20" fill="var(--sil-1)" />
      <rect x="10" y="10" width="100" height="180" rx="15" fill="var(--sil-2)" />
      <rect x="44" y="16" width="32" height="9" rx="4.5" fill="var(--sil-1)" />
    </svg>
  ),
  laptop: (
    <svg viewBox="0 0 240 150" className="w-[72%]">
      <rect x="30" y="4" width="180" height="120" rx="8" fill="var(--sil-1)" />
      <rect x="38" y="12" width="164" height="104" rx="3" fill="#2b3a67" />
      <path d="M4 128h232l-10 16H14z" fill="var(--sil-4)" />
      <rect x="100" y="128" width="40" height="4" rx="2" fill="var(--sil-6)" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 160 160" className="w-[55%]">
      <path
        d="M20 100V80a60 60 0 0 1 120 0v20"
        fill="none"
        stroke="var(--sil-1)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <rect x="6" y="88" width="34" height="58" rx="17" fill="var(--sil-1)" />
      <rect x="120" y="88" width="34" height="58" rx="17" fill="var(--sil-1)" />
    </svg>
  ),
  watch: (
    <svg viewBox="0 0 120 200" className="h-[62%]">
      <rect x="30" y="0" width="60" height="200" rx="14" fill="var(--sil-3)" />
      <rect x="8" y="46" width="104" height="108" rx="26" fill="var(--sil-1)" />
      <rect x="16" y="54" width="88" height="92" rx="19" fill="#0b0b0c" />
      <text
        x="60"
        y="108"
        textAnchor="middle"
        fill="#fff"
        fontSize="24"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        10:09
      </text>
    </svg>
  ),
  tablet: (
    <svg viewBox="0 0 160 210" className="h-[64%]">
      <rect x="4" y="4" width="152" height="202" rx="14" fill="var(--sil-3)" />
      <rect x="12" y="12" width="136" height="186" rx="8" fill="var(--sil-5)" />
      <path d="M12 150 148 60v130a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" fill="var(--sil-4)" />
    </svg>
  ),
  accessory: (
    <svg viewBox="0 0 160 160" className="w-[45%]">
      <rect x="30" y="20" width="100" height="80" rx="16" fill="var(--sil-5)" stroke="var(--sil-4)" strokeWidth="3" />
      <rect x="62" y="44" width="10" height="24" rx="3" fill="var(--sil-6)" />
      <rect x="88" y="44" width="10" height="24" rx="3" fill="var(--sil-6)" />
      <path d="M80 100v24c0 16 20 16 20 30" fill="none" stroke="var(--sil-4)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 160 160" className="w-[40%]">
      <path d="m80 10 60 32v76l-60 32-60-32V42z" fill="var(--sil-5)" />
      <path d="m20 42 60 32 60-32M80 74v76" fill="none" stroke="var(--sil-4)" strokeWidth="3" />
    </svg>
  ),
};

function DeviceSilhouette({ kind }: { kind: DeviceKind }) {
  return (
    <div
      role="img"
      aria-label="Фото скоро появится"
      className="flex h-full w-full items-center justify-center opacity-95"
    >
      {silhouettes[kind]}
    </div>
  );
}
