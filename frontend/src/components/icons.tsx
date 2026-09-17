import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
  </Icon>
);

export const CartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 4h2l2.2 11.1a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6" />
    <circle cx="9.5" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12 5 5 9-10" />
  </Icon>
);

export const TruckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const SlidersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Icon>
);

/* Иконки админки */

export const DashboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
  </Icon>
);

export const FolderIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
  </Icon>
);

export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 12.1V4.5a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l8 8a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-8-8a1 1 0 0 1-.3-.7Z" />
    <circle cx="8" cy="8" r="1.3" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
  </Icon>
);

export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11" />
  </Icon>
);

export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const ImageIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19" />
  </Icon>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 6-6 6 6 6" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

/* Иконки категорий */

const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Icon>
);

const LaptopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="5" width="15" height="10" rx="1.5" />
    <path d="M2.5 18.5h19" />
  </Icon>
);

const HeadphonesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    <rect x="3" y="14" width="4" height="6" rx="1.5" />
    <rect x="17" y="14" width="4" height="6" rx="1.5" />
  </Icon>
);

const WatchIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6.5" y="6" width="11" height="12" rx="3" />
    <path d="M9 6V3h6v3M9 18v3h6v-3" />
  </Icon>
);

const AccessoryIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="13" height="10" rx="2" />
    <path d="m16 10 5-3v10l-5-3" />
  </Icon>
);

const TabletIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2" />
    <path d="M11 18.5h2" />
  </Icon>
);

export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </Icon>
);

export type DeviceKind =
  | "phone"
  | "laptop"
  | "audio"
  | "watch"
  | "tablet"
  | "accessory"
  | "other";

/** Тип устройства по slug категории — для иконок и заглушек фото. */
export function deviceKind(slug: string): DeviceKind {
  // Аудио раньше смартфонов: «headphones» содержит «phone».
  if (/audio|head|naush|speaker|kolonk/.test(slug)) return "audio";
  if (/phone|smart(?!-?watch)/.test(slug)) return "phone";
  if (/laptop|notebook|noutbuk/.test(slug)) return "laptop";
  if (/watch|chas/.test(slug)) return "watch";
  if (/tablet|planshet/.test(slug)) return "tablet";
  if (/access|aksess/.test(slug)) return "accessory";
  return "other";
}

const categoryIcons = {
  phone: PhoneIcon,
  laptop: LaptopIcon,
  audio: HeadphonesIcon,
  watch: WatchIcon,
  tablet: TabletIcon,
  accessory: AccessoryIcon,
  other: BoxIcon,
};

export function CategoryIcon({ slug, ...p }: IconProps & { slug: string }) {
  const Component = categoryIcons[deviceKind(slug)];
  return <Component {...p} />;
}
