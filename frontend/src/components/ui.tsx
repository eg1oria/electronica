import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "accent" | "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-white hover:bg-accent-hover",
  primary: "bg-inverse text-inverse-fg hover:opacity-85",
  secondary: "bg-bg text-fg border border-border hover:bg-surface",
  ghost: "text-fg hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-btn font-semibold whitespace-nowrap transition-[background-color,opacity,color] disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${sizes[size]}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant,
  size,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, size)} ${className}`}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant,
  size,
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${buttonClass(variant, size)} ${className}`} {...props} />
  );
}

type BadgeTone = "dark" | "danger" | "accent" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  dark: "bg-inverse text-inverse-fg",
  danger: "bg-danger text-white",
  accent: "bg-accent text-white",
  neutral: "bg-bg text-accent",
};

export function Badge({
  tone = "dark",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[0.75rem] leading-none font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-h2 font-semibold sm:text-h1">{title}</h2>
      {action}
    </div>
  );
}

export function StockStatus({ stock }: { stock: number }) {
  const inStock = stock > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${inStock ? "text-success" : "text-muted"}`}
    >
      <span
        className={`size-1.5 rounded-full ${inStock ? "bg-success" : "bg-muted"}`}
      />
      {inStock ? (stock < 5 ? "Осталось мало" : "В наличии") : "Нет в наличии"}
    </span>
  );
}

export const inputClass =
  "h-11 w-full rounded-btn border border-border bg-bg px-3.5 text-base text-fg placeholder:text-muted transition-colors outline-none focus:border-accent sm:text-sm";
