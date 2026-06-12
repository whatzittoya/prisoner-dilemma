/**
 * Small shared UI primitives so every screen looks consistent without pulling
 * in a component library. Tailwind classes only.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-amber-500 text-stone-950 hover:bg-amber-400 focus-visible:ring-amber-400",
  secondary:
    "border border-white/15 text-stone-100 hover:bg-white/10 focus-visible:ring-white/30",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400",
  ghost: "text-stone-300 hover:bg-white/5 focus-visible:ring-white/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  accent = "text-stone-100",
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className={`text-lg font-semibold tabular-nums ${accent}`}>
        {value}
      </span>
    </div>
  );
}

/** Big, copyable room code. */
export function CodeBadge({ code }: { code: string }) {
  return (
    <span className="font-mono text-2xl font-bold tracking-[0.3em] text-amber-400">
      {code}
    </span>
  );
}
